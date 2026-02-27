"""
Configurazione Celery per task scheduling.
Supporta sync periodiche e job in background.
"""

from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

settings = get_settings()

# Inizializza app Celery
celery_app = Celery(
    "atomic_crm",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.sync_jobs"],
)

# Configurazione
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 ora max per task
    worker_prefetch_multiplier=1,
    beat_schedule={},  # Popolato dinamicamente
)

# Schedule automatica se abilitata
if settings.AUTO_SYNC_ENABLED:
    celery_app.conf.beat_schedule = {
        "sync-dynamics-bc": {
            "task": "app.tasks.sync_jobs.run_dynamics_bc_sync",
            "schedule": crontab(),  # Parse da settings.AUTO_SYNC_CRON
        },
    }


@celery_app.task(bind=True, max_retries=3)
def debug_task(self):
    """Task di test"""
    print(f"Request: {self.request!r}")
    return {"status": "ok", "task_id": self.request.id}
