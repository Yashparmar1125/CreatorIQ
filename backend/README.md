# CreatorIQ Backend

Microservices backend for CreatorIQ. All services run in Docker for local development.

## Quick start (Docker — recommended)

```powershell
cd backend
.\scripts\docker-up.ps1
```

This script will:
1. Generate JWT keys in `secrets/` (if missing)
2. Build all service images
3. Start Postgres + Redis
4. Run Alembic migrations for all services
5. Start all 8 microservices + API gateway
6. Run health checks

**API entry point:** `http://localhost:8000/v1`

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows)
- PowerShell

## Configuration

1. Copy environment file (if you don't have `.env` yet):

```powershell
copy .env.example .env
```

2. Edit `backend/.env` with your secrets:
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth
   - `SERPAPI_API_KEY` — trends
   - `OPENROUTER_API_KEY` — strategy LLM
   - `AES_ENCRYPTION_KEY` — Fernet key for OAuth token encryption
   - `INTERNAL_SERVICE_TOKEN` — shared secret (must match across services)

Generate Fernet key:

```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

3. Generate JWT keys (or let `docker-up.ps1` do it):

```powershell
.\scripts\generate-jwt-keys.ps1
```

> **Note:** `docker-compose.yml` overrides `DATABASE_URL`, `REDIS_URL`, and service URLs to use Docker internal networking. Your Azure DB URL in `.env` is ignored when running via Docker.

## Manual Docker commands

```powershell
# Build
docker compose build

# Start everything
docker compose up -d

# View logs
docker compose logs -f api-gateway

# Stop
docker compose down

# Stop and remove volumes (fresh DB)
docker compose down -v
```

### Run migrations only

```powershell
docker compose up -d postgres
docker compose --profile migrate run --rm migrate-auth
docker compose --profile migrate run --rm migrate-channel
docker compose --profile migrate run --rm migrate-trend
docker compose --profile migrate run --rm migrate-strategy
docker compose --profile migrate run --rm migrate-planner
docker compose --profile migrate run --rm migrate-analytics
```

## Services

| Service | Port | Health |
|---------|------|--------|
| API Gateway | 8000 | `GET /health` |
| Auth | 8001 | `GET /auth/health` |
| Channel | 8002 | `GET /health` |
| Trend | 8003 | `GET /health` |
| Strategy | 8004 | `GET /health` |
| Planner | 8005 | `GET /health` |
| Analytics | 8006 | `GET /health` |
| ML | 8007 | `GET /health` |
| Postgres | 5432 | — |
| Redis | 6379 | — |

## Frontend connection

In `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/v1
```

## Google OAuth redirect URI

Add to Google Cloud Console:

```
http://localhost:8000/v1/auth/google/callback
```

## Architecture

See [../README.md](../README.md) for full architecture, trends engine, and API overview. Additional backend docs: `docs/` and per-service READMEs.
