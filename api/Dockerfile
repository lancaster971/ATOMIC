# Atomic CRM API - FastAPI
# Multi-stage build per immagine ottimizzata

# ============== STAGE 1: Builder ==============
FROM python:3.12-slim AS builder

WORKDIR /app

# Installa dipendenze build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Crea virtualenv
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Installa dipendenze
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ============== STAGE 2: Runtime ==============
FROM python:3.12-slim AS runtime

WORKDIR /app

# Installa solo librerie runtime necessarie
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia virtualenv
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Crea utente non-root
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copia codice applicazione
COPY --chown=appuser:appuser app/ ./app/

# Switch a utente non-root
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health/live || exit 1

# Espone porta
EXPOSE 8000

# Avvia applicazione
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
