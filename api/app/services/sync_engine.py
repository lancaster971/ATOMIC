"""
Motore di sincronizzazione universale.
Gestisce logica di mapping, conflitti e trasformazioni.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete
from typing import List, Dict, Any, Optional, Type
from datetime import datetime
import structlog

from app.models.schemas import (
    SyncSource, SyncDirection, EntityType,
    ContactSync, CompanySync,
    DynamicsBCCustomer, DynamicsBCVendor,
)
from app.services.dynamics_bc import DynamicsBCClient, DynamicsBCError

logger = structlog.get_logger()


class SyncEngine:
    """
    Motore di sincronizzazione dati.
    Supporta multipli source e direzioni.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self._clients: Dict[SyncSource, Any] = {}
    
    async def sync(
        self,
        source: SyncSource,
        direction: SyncDirection,
        entity_types: List[EntityType],
        dry_run: bool = False,
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Esegui sincronizzazione completa.
        
        Returns:
            Dict con statistiche e errori
        """
        results = {
            "success": True,
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "failed": 0,
            "stats": {},
            "errors": [],
        }
        
        logger.info(
            "sync.started",
            source=source,
            direction=direction,
            entities=entity_types,
            dry_run=dry_run,
        )
        
        try:
            # Sincronizza per ogni tipo entità
            for entity_type in entity_types:
                entity_result = await self._sync_entity_type(
                    source=source,
                    direction=direction,
                    entity_type=entity_type,
                    dry_run=dry_run,
                    filters=filters,
                )
                
                results["created"] += entity_result.get("created", 0)
                results["updated"] += entity_result.get("updated", 0)
                results["skipped"] += entity_result.get("skipped", 0)
                results["failed"] += entity_result.get("failed", 0)
                results["stats"][entity_type.value] = entity_result
                results["errors"].extend(entity_result.get("errors", []))
            
            # Determina successo
            if results["failed"] > 0:
                results["success"] = results["created"] + results["updated"] > 0
            
        except Exception as e:
            logger.error("sync.failed", error=str(e), exc_info=True)
            results["success"] = False
            results["errors"].append({
                "type": "fatal",
                "error": str(e),
            })
        
        logger.info(
            "sync.completed",
            source=source,
            created=results["created"],
            updated=results["updated"],
            failed=results["failed"],
        )
        
        return results
    
    async def _sync_entity_type(
        self,
        source: SyncSource,
        direction: SyncDirection,
        entity_type: EntityType,
        dry_run: bool,
        filters: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Sincronizza singolo tipo entità"""
        
        result = {"created": 0, "updated": 0, "skipped": 0, "failed": 0, "errors": []}
        
        if source == SyncSource.DYNAMICS_BC:
            if entity_type == EntityType.CONTACT:
                return await self._sync_dynamics_bc_contacts(direction, dry_run, filters)
            elif entity_type == EntityType.COMPANY:
                return await self._sync_dynamics_bc_companies(direction, dry_run, filters)
        
        # Altri source...
        logger.warning("sync.source_not_implemented", source=source, entity=entity_type)
        return result
    
    async def _sync_dynamics_bc_contacts(
        self,
        direction: SyncDirection,
        dry_run: bool,
        filters: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Sincronizza contatti da/a Dynamics BC"""
        result = {"created": 0, "updated": 0, "skipped": 0, "failed": 0, "errors": []}
        
        if direction in [SyncDirection.INBOUND, SyncDirection.BIDIRECTIONAL]:
            # BC → CRM
            async with DynamicsBCClient() as client:
                # Determina data ultima sync
                modified_since = None
                if filters and filters.get("last_sync"):
                    modified_since = filters["last_sync"]
                
                # Fetch customers
                try:
                    customers = await client.get_customers(modified_since=modified_since)
                    logger.info("dynamics_bc.fetched_customers", count=len(customers))
                    
                    for customer in customers:
                        try:
                            sync_result = await self._upsert_contact_from_bc(customer, dry_run)
                            if sync_result == "created":
                                result["created"] += 1
                            elif sync_result == "updated":
                                result["updated"] += 1
                            else:
                                result["skipped"] += 1
                        except Exception as e:
                            result["failed"] += 1
                            result["errors"].append({
                                "entity": "contact",
                                "external_id": customer.id,
                                "error": str(e),
                            })
                
                except DynamicsBCError as e:
                    result["errors"].append({
                        "entity": "connection",
                        "error": str(e),
                    })
        
        if direction in [SyncDirection.OUTBOUND, SyncDirection.BIDIRECTIONAL]:
            # CRM → BC (da implementare)
            pass
        
        return result
    
    async def _upsert_contact_from_bc(
        self, 
        customer: DynamicsBCCustomer, 
        dry_run: bool
    ) -> str:
        """
        Inserisce o aggiorna contatto da Dynamics BC.
        
        Returns:
            "created", "updated", o "skipped"
        """
        # Mappa BC Customer → CRM Contact
        contact_data = {
            "first_name": self._extract_first_name(customer.display_name),
            "last_name": self._extract_last_name(customer.display_name),
            "email": customer.email,
            "phone": customer.phone,
            "address": customer.address,
            "city": customer.city,
            "country": customer.country,
            "external_id": customer.id or customer.number,
            "source": SyncSource.DYNAMICS_BC,
            "last_sync_at": datetime.utcnow(),
            "raw_data": customer.model_dump(),
        }
        
        if dry_run:
            logger.debug("sync.dry_run", contact=contact_data)
            return "skipped"
        
        # TODO: Implementare query SQL su tabella contacts
        # Per ora logghiamo
        logger.info("sync.upsert_contact", external_id=contact_data["external_id"])
        
        # Query: cerca per external_id
        # Se esiste: UPDATE
        # Se non esiste: INSERT
        
        return "created"  # Mock
    
    async def _sync_dynamics_bc_companies(
        self,
        direction: SyncDirection,
        dry_run: bool,
        filters: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Sincronizza aziende da BC (vendors come potenziali partner)"""
        result = {"created": 0, "updated": 0, "skipped": 0, "failed": 0, "errors": []}
        
        # Simile a contatti ma con vendors
        return result
    
    async def preview(
        self,
        source: SyncSource,
        entity_type: EntityType,
    ) -> List[Dict[str, Any]]:
        """
        Anteprima dati che verrebbero sincronizzati.
        Non modifica il database.
        """
        preview_data = []
        
        if source == SyncSource.DYNAMICS_BC and entity_type == EntityType.CONTACT:
            async with DynamicsBCClient() as client:
                customers = await client.get_customers(top=10)
                for customer in customers:
                    preview_data.append({
                        "external_id": customer.id or customer.number,
                        "name": customer.display_name,
                        "email": customer.email,
                        "phone": customer.phone,
                        "last_modified": customer.last_modified.isoformat() if customer.last_modified else None,
                    })
        
        return preview_data
    
    async def validate_mapping(
        self,
        source: SyncSource,
        mapping: Dict[str, str],
    ) -> Dict[str, Any]:
        """
        Valida un mapping campi personalizzato.
        
        Returns:
            Dict con valid, errors, warnings
        """
        validation = {
            "valid": True,
            "errors": [],
            "warnings": [],
        }
        
        # Campi validi per CRM
        valid_crm_fields = {
            "first_name", "last_name", "email", "phone", "title",
            "company_id", "address", "city", "country", "gender",
        }
        
        for source_field, target_field in mapping.items():
            if target_field not in valid_crm_fields:
                validation["warnings"].append(
                    f"Target field '{target_field}' not in standard CRM fields"
                )
        
        return validation
    
    # ============== HELPERS ==============
    
    def _extract_first_name(self, full_name: str) -> str:
        """Estrae nome da display name"""
        parts = full_name.split(maxsplit=1)
        return parts[0] if parts else full_name
    
    def _extract_last_name(self, full_name: str) -> str:
        """Estrae cognome da display name"""
        parts = full_name.split(maxsplit=1)
        return parts[1] if len(parts) > 1 else ""
