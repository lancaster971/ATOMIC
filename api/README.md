# Atomic CRM API

Backend FastAPI per sincronizzazione dati con sistemi esterni (ERP, CRM, etc.)

## 🚀 Quick Start

### 1. Setup Python Environment

```bash
cd api

# Crea virtualenv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installa dipendenze
pip install -r requirements.txt
```

### 2. Configurazione

```bash
# Copia config di esempio
cp .env.example .env

# Edita .env con i tuoi valori
nano .env
```

### 3. Avvio (development)

```bash
# Avvia server di sviluppo
python -m app.main

# Oppure con uvicorn direttamente
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

L'API sarà disponibile su http://localhost:8000

- Documentazione: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health

### 4. Avvio con Docker

```bash
# Build e avvio
docker-compose up --build

# Solo API (senza Redis)
docker-compose up api

# Background
docker-compose up -d
```

## 📋 API Endpoints

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check completo |
| `/api/v1/health/ready` | GET | Kubernetes readiness probe |
| `/api/v1/health/live` | GET | Kubernetes liveness probe |
| `/api/v1/version` | GET | Info versione |
| `/api/v1/sync/trigger` | POST | Avvia sync manuale |
| `/api/v1/sync/jobs/{id}` | GET | Stato job sync |
| `/api/v1/sync/jobs` | GET | Lista job |
| `/api/v1/sync/preview/{source}` | GET | Anteprima dati |
| `/api/v1/webhooks/{source}` | POST | Ricezione webhook |

## 🔗 Integrazioni Supportate

### Dynamics 365 Business Central

**Configurazione richiesta:**
- `ATOMIC_API_DYNAMICS_BC_ENABLED=true`
- `ATOMIC_API_DYNAMICS_BC_TENANT_ID` - Azure AD Tenant ID
- `ATOMIC_API_DYNAMICS_BC_CLIENT_ID` - App registration client ID
- `ATOMIC_API_DYNAMICS_BC_CLIENT_SECRET` - Client secret
- `ATOMIC_API_DYNAMICS_BC_COMPANY_ID` - ID azienda BC

**Endpoint BC:**
- OAuth: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
- API: `https://api.businesscentral.dynamics.com/v2.0/{tenant}/{environment}/api/v2.0`

**Esempio sync:**
```bash
curl -X POST http://localhost:8000/api/v1/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "source": "dynamics_bc",
    "direction": "inbound",
    "entity_types": ["contact", "company"],
    "dry_run": false,
    "filters": {"last_sync": "2024-01-01T00:00:00Z"}
  }'
```

## 🔐 Webhook Security

I webhook possono essere protetti con firma HMAC:

```bash
# Genera secret
openssl rand -hex 32

# Configura in .env
ATOMIC_API_WEBHOOK_SECRET=tuo-secret

# Invio webhook con firma
curl -X POST http://localhost:8000/api/v1/webhooks/dynamics_bc \
  -H "X-Hub-Signature-256: sha256=$(echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac 'tuo-secret')" \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{}}'
```

## 🧪 Testing

```bash
# Esegui test
pytest

# Con coverage
pytest --cov=app --cov-report=html
```

## 📁 Struttura

```
api/
├── app/
│   ├── main.py              # Entry point FastAPI
│   ├── config.py            # Settings (Pydantic)
│   ├── database.py          # SQLAlchemy setup
│   ├── routers/
│   │   ├── health.py        # Health checks
│   │   ├── sync.py          # Sync endpoints
│   │   └── webhooks.py      # Webhook handlers
│   ├── services/
│   │   ├── dynamics_bc.py   # Client Dynamics BC
│   │   └── sync_engine.py   # Logica sincronizzazione
│   └── models/
│       └── schemas.py       # Pydantic models
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

## 🔌 Connessione DB Supabase

L'API si connette direttamente al PostgreSQL di Supabase:

**Locale:**
```
postgresql://postgres:postgres@localhost:54322/postgres
```

**Remoto:**
```
postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

> ⚠️ **Attenzione:** Usa la **Connection String** dalla sezione "Database Settings" di Supabase Dashboard.
