"""
Configurazione applicazione FastAPI.
Tutte le variabili d'ambiente hanno prefisso ATOMIC_API_
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Impostazioni applicazione"""
    
    model_config = SettingsConfigDict(
        env_prefix="ATOMIC_API_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # App
    APP_NAME: str = "Atomic CRM API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database (stesso PostgreSQL di Supabase)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:54322/postgres"
    
    # Redis (per Celery/cache)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Supabase
    SUPABASE_URL: str = "http://localhost:54321"
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Dynamics BC (Business Central)
    DYNAMICS_BC_ENABLED: bool = False
    DYNAMICS_BC_TENANT_ID: Optional[str] = None
    DYNAMICS_BC_ENVIRONMENT: str = "production"
    DYNAMICS_BC_COMPANY_ID: Optional[str] = None
    DYNAMICS_BC_CLIENT_ID: Optional[str] = None
    DYNAMICS_BC_CLIENT_SECRET: Optional[str] = None
    DYNAMICS_BC_BASE_URL: Optional[str] = None  # es: https://api.businesscentral.dynamics.com/v2.0/{tenant}/{environment}/api/v2.0
    
    # Webhook Security
    WEBHOOK_SECRET: Optional[str] = None
    
    # Sync Settings
    SYNC_BATCH_SIZE: int = 100
    SYNC_TIMEOUT_SECONDS: int = 300
    AUTO_SYNC_ENABLED: bool = False
    AUTO_SYNC_CRON: str = "0 */6 * * *"  # Ogni 6 ore di default
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json o console


@lru_cache()
def get_settings() -> Settings:
    """Restituisce settings cached"""
    return Settings()
