# Atomic CRM API - Makefile

.PHONY: help install dev test lint build run docker-build docker-up docker-down clean

# Default target
help:
	@echo "Atomic CRM API - Comandi disponibili:"
	@echo ""
	@echo "  make install       - Installa dipendenze Python"
	@echo "  make dev           - Avvia server di sviluppo"
	@echo "  make test          - Esegui test suite"
	@echo "  make test-cov      - Esegui test con coverage"
	@echo "  make lint          - Controlla codice con ruff/mypy"
	@echo "  make format        - Formatta codice"
	@echo "  make build         - Build Docker image"
	@echo "  make run           - Avvia con Docker Compose"
	@echo "  make stop          - Ferma Docker Compose"
	@echo "  make clean         - Pulisci file temporanei"
	@echo ""

# Setup
install:
	pip install -r requirements.txt

# Development
dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Testing
test:
	pytest -v

test-cov:
	pytest --cov=app --cov-report=term-missing --cov-report=html

# Code quality
lint:
	ruff check app/
	mypy app/

format:
	ruff format app/
	ruff check --fix app/

# Docker
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f api

docker-shell:
	docker-compose exec api /bin/sh

# Cleanup
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name ".coverage" -delete
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
