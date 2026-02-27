"""
Router per ricezione webhook da sistemi esterni.
Supporta verifica firme e processing asincrono.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Request, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any
import hmac
import hashlib
import structlog

from app.database import get_db
from app.models.schemas import WebhookPayload, WebhookResponse, SyncSource
from app.config import get_settings

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = structlog.get_logger()


def _verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verifica HMAC-SHA256 signature"""
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    # Supporta formati: "sha256=<hash>" o "<hash>"
    if signature.startswith("sha256="):
        signature = signature[7:]
    
    return hmac.compare_digest(expected, signature)


@router.post("/{source}", response_model=WebhookResponse)
async def receive_webhook(
    source: SyncSource,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    x_signature: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
    x_event_type: Optional[str] = Header(None, alias="X-Event-Type"),
):
    """
    Riceve webhook da sistemi esterni.
    
    Esempi:
    - Dynamics BC: quando un cliente viene modificato
    - Salesforce: eventi platform
    - HubSpot: contact/company updates
    
    Headers:
    - X-Hub-Signature-256: Firma HMAC per verifica (opzionale)
    - X-Event-Type: Tipo evento (es: "contact.updated")
    """
    settings = get_settings()
    
    # Leggi raw body per verifica firma
    body = await request.body()
    
    # Verifica firma se configurata
    if settings.WEBHOOK_SECRET and x_signature:
        if not _verify_signature(body, x_signature, settings.WEBHOOK_SECRET):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )
    
    # Parse payload
    try:
        payload_data = await request.json()
    except Exception:
        # Supporta anche form-urlencoded
        payload_data = dict(await request.form()) or {"raw": body.decode()}
    
    webhook_payload = WebhookPayload(
        source=source,
        event_type=x_event_type or "unknown",
        timestamp=__import__('datetime').datetime.utcnow(),
        data=payload_data,
        signature=x_signature,
    )
    
    logger.info(
        "webhook.received",
        source=source,
        event=webhook_payload.event_type,
        has_signature=bool(x_signature),
    )
    
    # Processa in background (non bloccare risposta)
    background_tasks.add_task(
        _process_webhook,
        payload=webhook_payload,
        db=db
    )
    
    return WebhookResponse(
        received=True,
        processed=False,
        message="Webhook received and queued for processing"
    )


@router.post("/{source}/validate")
async def validate_webhook_config(source: SyncSource):
    """Valida configurazione webhook per un source"""
    settings = get_settings()
    
    checks = {
        "source": source,
        "webhook_secret_configured": bool(settings.WEBHOOK_SECRET),
    }
    
    if source == SyncSource.DYNAMICS_BC:
        checks["dynamics_bc_enabled"] = settings.DYNAMICS_BC_ENABLED
        checks["dynamics_bc_configured"] = all([
            settings.DYNAMICS_BC_TENANT_ID,
            settings.DYNAMICS_BC_CLIENT_ID,
            settings.DYNAMICS_BC_CLIENT_SECRET,
        ])
    
    return checks


async def _process_webhook(payload: WebhookPayload, db: AsyncSession):
    """Processa webhook in background"""
    logger.info(
        "webhook.processing",
        source=payload.source,
        event=payload.event_type,
    )
    
    try:
        # Implementa logica specifica per source
        if payload.source == SyncSource.DYNAMICS_BC:
            await _process_dynamics_bc_webhook(payload, db)
        elif payload.source == SyncSource.SALESFORCE:
            await _process_salesforce_webhook(payload, db)
        elif payload.source == SyncSource.HUBSPOT:
            await _process_hubspot_webhook(payload, db)
        else:
            logger.warning("webhook.unsupported_source", source=payload.source)
    
    except Exception as e:
        logger.error(
            "webhook.processing_error",
            source=payload.source,
            error=str(e),
            exc_info=True,
        )


async def _process_dynamics_bc_webhook(payload: WebhookPayload, db: AsyncSession):
    """Processa webhook Dynamics BC"""
    # Esempio: trigger sync immediata per entità modificata
    event = payload.event_type.lower()
    
    if "customer" in event or "contact" in event:
        # Avvia sync contatti
        logger.info("webhook.triggering_contact_sync", event=event)
        # Qui puoi chiamare SyncEngine o mettere in coda Celery
    
    elif "vendor" in event or "company" in event:
        # Avvia sync aziende
        logger.info("webhook.triggering_company_sync", event=event)


async def _process_salesforce_webhook(payload: WebhookPayload, db: AsyncSession):
    """Processa webhook Salesforce Platform Events"""
    logger.info("webhook.salesforce", event=payload.event_type)


async def _process_hubspot_webhook(payload: WebhookPayload, db: AsyncSession):
    """Processa webhook HubSpot"""
    logger.info("webhook.hubspot", event=payload.event_type)
