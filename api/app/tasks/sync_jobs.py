"""
Celery tasks per sincronizzazione.
"""

from celery import Task
from typing import List, Dict, Any
import structlog

from app.tasks.scheduler import celery_app
from app.database import SyncSessionLocal
from app.services.sync_engine import SyncEngine
from app.models.schemas import SyncSource, SyncDirection, EntityType

logger = structlog.get_logger()


class DatabaseTask(Task):
    """Task base con accesso al database"""
    _db = None
    
    def after_return(self, *args, **kwargs):
        """Cleanup dopo esecuzione"""
        if self._db:
            self._db.close()
            self._db = None


@celery_app.task(base=DatabaseTask, bind=True, max_retries=3, default_retry_delay=60)
def run_dynamics_bc_sync(
    self,
    direction: str = "inbound",
    entity_types: List[str] = None,
    filters: Dict[str, Any] = None,
):
    """
    Task Celery: Sincronizzazione Dynamics BC.
    
    Args:
        direction: "inbound", "outbound", "bidirectional"
        entity_types: Lista ["contact", "company", ...]
        filters: Dict con filtri (es: {"last_sync": "2024-01-01"})
    """
    entity_types = entity_types or ["contact", "company"]
    
    logger.info(
        "celery_task.started",
        task="run_dynamics_bc_sync",
        direction=direction,
        entities=entity_types,
    )
    
    try:
        # Crea sessione DB
        db = SyncSessionLocal()
        
        # Inizializza engine
        engine = SyncEngine(db)
        
        # Converte stringhe in enum
        entity_enums = [EntityType(et) for et in entity_types]
        direction_enum = SyncDirection(direction)
        
        # Esegui sync
        result = engine.sync(
            source=SyncSource.DYNAMICS_BC,
            direction=direction_enum,
            entity_types=entity_enums,
            dry_run=False,
            filters=filters,
        )
        
        logger.info(
            "celery_task.completed",
            task="run_dynamics_bc_sync",
            created=result.get("created"),
            updated=result.get("updated"),
            failed=result.get("failed"),
        )
        
        return {
            "status": "success" if result.get("success") else "partial",
            **result
        }
    
    except Exception as exc:
        logger.error(
            "celery_task.failed",
            task="run_dynamics_bc_sync",
            error=str(exc),
            retry=self.request.retries,
        )
        # Retry con backoff
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
    
    finally:
        db.close()


@celery_app.task(base=DatabaseTask, bind=True)
def test_connection(self, source: str):
    """Testa connessione a sistema esterno"""
    from app.services.dynamics_bc import DynamicsBCClient
    
    if source == "dynamics_bc":
        client = DynamicsBCClient()
        result = client.test_connection()
        return result
    
    return {"error": f"Unknown source: {source}"}


@celery_app.task
cleanup_old_logs(days: int = 30):
    """Pulizia log vecchi"""
    logger.info("cleanup.started", days=days)
    # Implementa pulizia se necessario
    return {"cleaned": 0}
