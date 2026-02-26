"""
Client per Microsoft Dynamics 365 Business Central.
Supporta API REST OData v4.

Documentazione:
https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/
"""

import httpx
from typing import Optional, List, Dict, Any, AsyncGenerator
from datetime import datetime
import base64
import structlog

from app.config import get_settings
from app.models.schemas import DynamicsBCCustomer, DynamicsBCVendor

logger = structlog.get_logger()


class DynamicsBCError(Exception):
    """Errore API Dynamics BC"""
    pass


class DynamicsBCClient:
    """Client per API Dynamics 365 Business Central"""
    
    def __init__(
        self,
        tenant_id: Optional[str] = None,
        environment: Optional[str] = None,
        company_id: Optional[str] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        settings = get_settings()
        
        self.tenant_id = tenant_id or settings.DYNAMICS_BC_TENANT_ID
        self.environment = environment or settings.DYNAMICS_BC_ENVIRONMENT
        self.company_id = company_id or settings.DYNAMICS_BC_COMPANY_ID
        self.client_id = client_id or settings.DYNAMICS_BC_CLIENT_ID
        self.client_secret = client_secret or settings.DYNAMICS_BC_CLIENT_SECRET
        
        # Base URL dell'API
        if base_url:
            self.base_url = base_url.rstrip("/")
        elif settings.DYNAMICS_BC_BASE_URL:
            self.base_url = settings.DYNAMICS_BC_BASE_URL.rstrip("/")
        else:
            # Costruisci URL standard
            self.base_url = (
                f"https://api.businesscentral.dynamics.com/v2.0/"
                f"{self.tenant_id}/{self.environment}/api/v2.0"
            )
        
        self._access_token: Optional[str] = None
        self._token_expires: Optional[datetime] = None
        self._http_client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self):
        """Async context manager"""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Cleanup"""
        await self.close()
    
    async def connect(self):
        """Inizializza connessione e ottiene token OAuth"""
        self._http_client = httpx.AsyncClient(
            timeout=60.0,
            headers={"Accept": "application/json"}
        )
        await self._refresh_token()
    
    async def close(self):
        """Chiudi connessione"""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
    
    async def _refresh_token(self):
        """Ottiene/aggiorna token OAuth2 da Microsoft"""
        if not all([self.tenant_id, self.client_id, self.client_secret]):
            raise DynamicsBCError("Missing credentials for Dynamics BC")
        
        token_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "https://api.businesscentral.dynamics.com/.default",
        }
        
        try:
            response = await self._http_client.post(token_url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            self._access_token = token_data["access_token"]
            expires_in = token_data.get("expires_in", 3600)
            self._token_expires = datetime.utcnow().timestamp() + expires_in - 300  # 5min buffer
            
            # Aggiorna header
            self._http_client.headers["Authorization"] = f"Bearer {self._access_token}"
            
            logger.info("dynamics_bc.token_refreshed", tenant=self.tenant_id)
            
        except httpx.HTTPStatusError as e:
            logger.error(
                "dynamics_bc.token_error",
                status=e.response.status_code,
                error=e.response.text
            )
            raise DynamicsBCError(f"OAuth failed: {e.response.text}")
    
    async def _ensure_token(self):
        """Verifica token valido"""
        if not self._access_token or datetime.utcnow().timestamp() > self._token_expires:
            await self._refresh_token()
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Esegue richiesta API"""
        await self._ensure_token()
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = await self._http_client.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json() if response.content else {}
            
        except httpx.HTTPStatusError as e:
            logger.error(
                "dynamics_bc.api_error",
                method=method,
                url=url,
                status=e.response.status_code,
                error=e.response.text
            )
            raise DynamicsBCError(f"API error {e.response.status_code}: {e.response.text}")
    
    # ============== CUSTOMERS ==============
    
    async def get_customers(
        self,
        modified_since: Optional[datetime] = None,
        top: int = 1000,
        skip: int = 0,
    ) -> List[DynamicsBCCustomer]:
        """
        Ottiene lista clienti da BC.
        
        Args:
            modified_since: Filtro per data ultima modifica
            top: Numero massimo risultati
            skip: Offset per paginazione
        """
        filters = []
        if modified_since:
            # OData filter
            iso_date = modified_since.strftime("%Y-%m-%dT%H:%M:%SZ")
            filters.append(f"lastModifiedDateTime gt {iso_date}")
        
        params = {
            "$top": top,
            "$skip": skip,
        }
        if filters:
            params["$filter"] = " and ".join(filters)
        
        data = await self._request("GET", "/companies", params=params)
        
        # Ottieni company ID se non specificato
        company_id = self.company_id
        if not company_id and data.get("value"):
            company_id = data["value"][0]["id"]
        
        if not company_id:
            return []
        
        # Ora fetch customers
        customers_data = await self._request(
            "GET", 
            f"/companies({company_id})/customers",
            params=params
        )
        
        customers = []
        for item in customers_data.get("value", []):
            try:
                customers.append(DynamicsBCCustomer.model_validate(item))
            except Exception as e:
                logger.warning("dynamics_bc.parse_error", item=item, error=str(e))
        
        return customers
    
    async def get_customer(self, customer_id: str) -> Optional[DynamicsBCCustomer]:
        """Ottiene singolo cliente per ID"""
        if not self.company_id:
            raise DynamicsBCError("Company ID required for single resource")
        
        data = await self._request(
            "GET", 
            f"/companies({self.company_id})/customers({customer_id})"
        )
        
        return DynamicsBCCustomer.model_validate(data) if data else None
    
    async def create_customer(self, customer_data: Dict[str, Any]) -> DynamicsBCCustomer:
        """Crea nuovo cliente in BC"""
        if not self.company_id:
            raise DynamicsBCError("Company ID required")
        
        data = await self._request(
            "POST",
            f"/companies({self.company_id})/customers",
            json=customer_data
        )
        
        return DynamicsBCCustomer.model_validate(data)
    
    async def update_customer(
        self, 
        customer_id: str, 
        customer_data: Dict[str, Any]
    ) -> DynamicsBCCustomer:
        """Aggiorna cliente esistente"""
        if not self.company_id:
            raise DynamicsBCError("Company ID required")
        
        # OData usa PUT/PATCH per update
        data = await self._request(
            "PATCH",
            f"/companies({self.company_id})/customers({customer_id})",
            json=customer_data,
            headers={"If-Match": "*"}  # Ottimistic concurrency
        )
        
        return DynamicsBCCustomer.model_validate(data)
    
    # ============== VENDORS ==============
    
    async def get_vendors(
        self,
        modified_since: Optional[datetime] = None,
        top: int = 1000,
        skip: int = 0,
    ) -> List[DynamicsBCVendor]:
        """Ottiene lista fornitori"""
        if not self.company_id:
            raise DynamicsBCError("Company ID required")
        
        filters = []
        if modified_since:
            iso_date = modified_since.strftime("%Y-%m-%dT%H:%M:%SZ")
            filters.append(f"lastModifiedDateTime gt {iso_date}")
        
        params = {
            "$top": top,
            "$skip": skip,
        }
        if filters:
            params["$filter"] = " and ".join(filters)
        
        data = await self._request(
            "GET",
            f"/companies({self.company_id})/vendors",
            params=params
        )
        
        vendors = []
        for item in data.get("value", []):
            try:
                vendors.append(DynamicsBCVendor.model_validate(item))
            except Exception as e:
                logger.warning("dynamics_bc.parse_error", item=item, error=str(e))
        
        return vendors
    
    # ============== UTILITIES ==============
    
    async def test_connection(self) -> Dict[str, Any]:
        """Testa connessione e restituisce info base"""
        try:
            # Ottieni lista companies
            data = await self._request("GET", "/companies")
            companies = data.get("value", [])
            
            return {
                "connected": True,
                "companies_found": len(companies),
                "companies": [{"id": c.get("id"), "name": c.get("name")} for c in companies[:5]],
                "tenant": self.tenant_id,
                "environment": self.environment,
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
            }
