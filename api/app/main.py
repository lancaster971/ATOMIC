"""
Atomic CRM API - FastAPI Application

API per sincronizzazione dati con sistemi esterni:
- Dynamics 365 Business Central
- Salesforce
- HubSpot
- API REST generiche

Documentazione automatica:
- Swagger UI: /docs
- ReDoc: /redoc
- OpenAPI: /openapi.json
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import structlog

from app.config import get_settings
from app.routers import health, sync, webhooks

# Configura logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer() if get_settings().LOG_FORMAT == "json" else structlog.dev.ConsoleRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestisce startup e shutdown"""
    # Startup
    logger.info(
        "api.starting",
        name=app.title,
        version=app.version,
        debug=settings.DEBUG,
    )
    
    # Verifica connessioni
    settings = get_settings()
    if settings.DYNAMICS_BC_ENABLED:
        logger.info("dynamics_bc.enabled")
    
    yield
    
    # Shutdown
    logger.info("api.shutting_down")


# Istanzia app
settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=__doc__,
    debug=settings.DEBUG,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione, specifica domini esatti
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(sync.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Endpoint root - redirect a documentazione"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "documentation": "/docs",
        "health": "/api/v1/health",
    }


@app.get("/api/v1")
async def api_info():
    """Info API v1"""
    return {
        "version": "v1",
        "endpoints": {
            "health": "/api/v1/health",
            "sync": "/api/v1/sync",
            "webhooks": "/api/v1/webhooks",
        },
        "features": {
            "dynamics_bc": settings.DYNAMICS_BC_ENABLED,
        }
    }


# Entry point per uvicorn
def main():
    """Entry point per avvio manuale"""
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )


if __name__ == "__main__":
    main()
