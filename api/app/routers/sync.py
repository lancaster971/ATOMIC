"""
Router per sincronizzazione dati con sistemi esterni.
Supporta Dynamics BC, Salesforce, HubSpot, e API REST generiche.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid
from datetime import datetime

from app.database import get_db
from app.models.schemas import (
    SyncJobCreate, 
    SyncJobResponse, 
    SyncSource,
    SyncStatus,
    EntityType,
    ContactSync,
    CompanySync,
)
from app.services.sync_engine import SyncEngine
from app.config import get_settings

router = APIRouter(prefix="/sync", tags=["Synchronization"])


# Store in-memory per job (in produzione usare Redis/DB)
_jobs_store: dict = {}


def _create_job_id() -> str:
    return str(uuid.uuid4())


@router.post("/trigger", response_model=SyncJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_sync(
    job: SyncJobCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Avvia una sincronizzazione manuale in background.
    
    Esempi:
    - Dynamics BC → CRM (contatti e aziende)
    - CRM → Dynamics BC (solo contatti modificati oggi)
    - Bidirezionale con dry-run (simulazione)
    """
    settings = get_settings()
    
    # Validazione configurazione
    if job.source == SyncSource.DYNAMICS_BC and not settings.DYNAMICS_BC_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dynamics BC integration not enabled. Check ATOMIC_API_DYNAMICS_BC_ENABLED env var."
        )
    
    job_id = _create_job_id()
    
    job_response = SyncJobResponse(
        id=job_id,
        source=job.source,
        direction=job.direction,
        entity_types=job.entity_types,
        dry_run=job.dry_run,
        filters=job.filters,
        status=SyncStatus.PENDING,
        created_at=datetime.utcnow(),
    )
    
    _jobs_store[job_id] = job_response
    
    # Avvia sync in background
    background_tasks.add_task(
        _run_sync_job,
        job_id=job_id,
        job=job,
        db=db
    )
    
    return job_response


@router.get("/jobs/{job_id}", response_model=SyncJobResponse)
async def get_sync_job(job_id: str):
    """Ottiene lo stato di un job di sincronizzazione"""
    if job_id not in _jobs_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    return _jobs_store[job_id]


@router.get("/jobs", response_model=List[SyncJobResponse])
async def list_sync_jobs(
    source: Optional[SyncSource] = None,
    status: Optional[SyncStatus] = None,
    limit: int = 50,
):
    """Lista job di sincronizzazione (più recenti prima)"""
    jobs = list(_jobs_store.values())
    
    if source:
        jobs = [j for j in jobs if j.source == source]
    if status:
        jobs = [j for j in jobs if j.status == status]
    
    # Ordina per created_at desc
    jobs.sort(key=lambda x: x.created_at, reverse=True)
    
    return jobs[:limit]


@router.get("/preview/{source}")
async def preview_sync(
    source: SyncSource,
    entity_type: EntityType = EntityType.CONTACT,
    db: AsyncSession = Depends(get_db),
):
    """
    Anteprima dei dati che verrebbero sincronizzati.
    Non modifica alcun dato.
    """
    engine = SyncEngine(db)
    
    try:
        preview_data = await engine.preview(
            source=source,
            entity_type=entity_type
        )
        return {
            "source": source,
            "entity_type": entity_type,
            "count": len(preview_data),
            "sample": preview_data[:10] if preview_data else [],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Preview failed: {str(e)}"
        )


@router.post("/validate-mapping/{source}")
async def validate_field_mapping(
    source: SyncSource,
    mapping: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Valida un mapping di campi personalizzato.
    Utile per configurare la sincronizzazione.
    """
    engine = SyncEngine(db)
    
    try:
        validation = await engine.validate_mapping(source, mapping)
        return {
            "valid": validation.get("valid", False),
            "errors": validation.get("errors", []),
            "warnings": validation.get("warnings", []),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation failed: {str(e)}"
        )


# ============== BACKGROUND TASK ==============

async def _run_sync_job(job_id: str, job: SyncJobCreate, db: AsyncSession):
    """
    Esegue il job di sync in background.
    """
    job_response = _jobs_store[job_id]
    job_response.status = SyncStatus.RUNNING
    job_response.started_at = datetime.utcnow()
    
    engine = SyncEngine(db)
    
    try:
        # Esegui sync
        result = await engine.sync(
            source=job.source,
            direction=job.direction,
            entity_types=job.entity_types,
            dry_run=job.dry_run,
            filters=job.filters,
        )
        
        # Aggiorna risultati
        job_response.status = SyncStatus.COMPLETED if result.get("success") else SyncStatus.PARTIAL
        job_response.entities_created = result.get("created", 0)
        job_response.entities_updated = result.get("updated", 0)
        job_response.entities_skipped = result.get("skipped", 0)
        job_response.entities_failed = result.get("failed", 0)
        job_response.stats = result.get("stats", {})
        job_response.errors = result.get("errors", [])
        
    except Exception as e:
        job_response.status = SyncStatus.FAILED
        job_response.error_message = str(e)
        job_response.errors.append({"error": str(e), "type": "exception"})
    
    finally:
        job_response.completed_at = datetime.utcnow()


# ============== ENTITIES ENDPOINTS ==============

@router.get("/entities/contacts", response_model=List[ContactSync])
async def list_contacts_to_sync(
    source: Optional[SyncSource] = None,
    external_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Lista contatti con stato di sincronizzazione"""
    # Query che include join con tabella di sync se presente
    # Per ora mock
    return []


@router.get("/entities/companies", response_model=List[CompanySync])
async def list_companies_to_sync(
    source: Optional[SyncSource] = None,
    external_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Lista aziende con stato di sincronizzazione"""
    return []
