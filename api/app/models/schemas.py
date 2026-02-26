"""
Pydantic schemas per API.
Modelli di richiesta/risposta validati.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum


# ============== ENUMS ==============

class SyncSource(str, Enum):
    """Sorgenti di sincronizzazione supportate"""
    DYNAMICS_BC = "dynamics_bc"
    SALESFORCE = "salesforce"
    HUBSPOT = "hubspot"
    GENERIC_REST = "generic_rest"


class SyncDirection(str, Enum):
    """Direzione sincronizzazione"""
    INBOUND = "inbound"      # Esterno → CRM
    OUTBOUND = "outbound"    # CRM → Esterno
    BIDIRECTIONAL = "bidirectional"


class SyncStatus(str, Enum):
    """Stato di un job di sync"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"  # Completato con errori


class EntityType(str, Enum):
    """Entità sincronizzabili"""
    CONTACT = "contact"
    COMPANY = "company"
    DEAL = "deal"
    TASK = "task"
    TAG = "tag"
    NOTE = "note"


# ============== BASE MODELS ==============

class HealthResponse(BaseModel):
    """Risposta health check"""
    status: Literal["ok", "error"] = "ok"
    version: str
    timestamp: datetime
    checks: Dict[str, Any] = Field(default_factory=dict)


class SyncJobBase(BaseModel):
    """Base per job di sincronizzazione"""
    source: SyncSource
    direction: SyncDirection = SyncDirection.BIDIRECTIONAL
    entity_types: List[EntityType] = Field(default_factory=lambda: [EntityType.CONTACT, EntityType.COMPANY])
    dry_run: bool = False  # Se True, simula senza modificare
    filters: Optional[Dict[str, Any]] = None  # Filtri per la sync (es: data ultima modifica)


class SyncJobCreate(SyncJobBase):
    """Richiesta creazione job sync"""
    pass


class SyncJobResponse(SyncJobBase):
    """Risposta job sync"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    status: SyncStatus = SyncStatus.PENDING
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    stats: Dict[str, Any] = Field(default_factory=dict)
    
    # Risultati
    entities_created: int = 0
    entities_updated: int = 0
    entities_skipped: int = 0
    entities_failed: int = 0
    errors: List[Dict[str, Any]] = Field(default_factory=list)


# ============== DYNAMICS BC MODELS ==============

class DynamicsBCConfig(BaseModel):
    """Configurazione connessione Dynamics BC"""
    tenant_id: str
    environment: str = "production"
    company_id: Optional[str] = None
    client_id: str
    client_secret: str
    base_url: Optional[str] = None


class DynamicsBCCustomer(BaseModel):
    """Modello cliente Dynamics BC"""
    model_config = ConfigDict(populate_by_name=True)
    
    id: Optional[str] = Field(None, alias="id")
    number: Optional[str] = Field(None, alias="number")
    display_name: str = Field(..., alias="displayName")
    email: Optional[str] = Field(None, alias="email")
    phone: Optional[str] = Field(None, alias="phoneNumber")
    address: Optional[str] = Field(None, alias="address")
    city: Optional[str] = Field(None, alias="city")
    country: Optional[str] = Field(None, alias="country")
    vat_registration_no: Optional[str] = Field(None, alias="taxRegistrationNo")
    blocked: Optional[str] = None
    last_modified: Optional[datetime] = Field(None, alias="lastModifiedDateTime")


class DynamicsBCVendor(BaseModel):
    """Modello fornitore Dynamics BC"""
    model_config = ConfigDict(populate_by_name=True)
    
    id: Optional[str] = None
    number: Optional[str] = Field(None, alias="number")
    display_name: str = Field(..., alias="displayName")
    email: Optional[str] = None
    phone: Optional[str] = Field(None, alias="phoneNumber")
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    vat_registration_no: Optional[str] = Field(None, alias="taxRegistrationNo")
    blocked: Optional[str] = None
    last_modified: Optional[datetime] = Field(None, alias="lastModifiedDateTime")


# ============== WEBHOOK MODELS ==============

class WebhookPayload(BaseModel):
    """Payload generico webhook"""
    source: SyncSource
    event_type: str  # es: "contact.created", "deal.updated"
    timestamp: datetime
    data: Dict[str, Any]
    signature: Optional[str] = None  # Per verifica HMAC


class WebhookResponse(BaseModel):
    """Risposta webhook"""
    received: bool = True
    processed: bool = False
    job_id: Optional[str] = None
    message: str = "Webhook received"


# ============== CONTACT/CRM MODELS ==============

class ContactSync(BaseModel):
    """Modello per sincronizzazione contatti"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    external_id: Optional[str] = None  # ID nel sistema esterno
    source: Optional[SyncSource] = None
    
    # Dati anagrafici
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    
    # Azienda
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    
    # Indirizzo
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    sync_version: Optional[int] = 0
    
    # Raw data (per debug/mapping avanzato)
    raw_data: Optional[Dict[str, Any]] = None


class CompanySync(BaseModel):
    """Modello per sincronizzazione aziende"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    external_id: Optional[str] = None
    source: Optional[SyncSource] = None
    
    name: str
    sector: Optional[str] = None
    size: Optional[str] = None  # 1_10, 11_50, etc.
    revenue: Optional[float] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    
    # Indirizzo
    address: Optional[str] = None
    city: Optional[str] = None
    zipcode: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    
    # Identificativi fiscali
    vat_number: Optional[str] = None
    tax_id: Optional[str] = None
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    raw_data: Optional[Dict[str, Any]] = None
