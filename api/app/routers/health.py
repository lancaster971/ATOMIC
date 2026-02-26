"""
Router per health checks e monitoring.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime
from typing import Dict, Any

from app.database import get_db
from app.config import get_settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=Dict[str, Any])
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check completo:
    - API risponde
    - Database raggiungibile
    - Configurazione caricata
    """
    settings = get_settings()
    checks = {
        "api": {"status": "ok", "version": settings.APP_VERSION},
        "database": {"status": "unknown"},
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    # Check database
    try:
        result = await db.execute(text("SELECT 1"))
        checks["database"]["status"] = "ok"
    except Exception as e:
        checks["database"]["status"] = "error"
        checks["database"]["error"] = str(e)
    
    # Determina stato globale
    overall_status = "ok" if all(
        c.get("status") == "ok" 
        for c in [checks["api"], checks["database"]]
    ) else "error"
    
    checks["status"] = overall_status
    
    return checks


@router.get("/health/ready")
async def readiness_probe(db: AsyncSession = Depends(get_db)):
    """
    Kubernetes readiness probe.
    Verifica che l'app sia pronta a ricevere traffico.
    """
    try:
        await db.execute(text("SELECT 1"))
        return {"ready": True}
    except Exception as e:
        return {"ready": False, "error": str(e)}


@router.get("/health/live")
async def liveness_probe():
    """
    Kubernetes liveness probe.
    Verifica che l'app sia viva.
    """
    return {"alive": True}


@router.get("/version")
async def version():
    """Restituisce versione e info build"""
    settings = get_settings()
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG,
    }
