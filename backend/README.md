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
4. Sync database schema via db-push (`create_all` from SQLAlchemy models — no Alembic)
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

> **Note:** `docker-compose.yml` uses `DATABASE_URL` / `REDIS_URL` from your shell environment when you run Compose. `docker-up.ps1` forces the local Docker Postgres/Redis URLs so an Azure URL in `.env` does not break local dev. For production deploy, use `deploy.ps1` with `backend/.env.production`.

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

### Sync schema only (db push)

```powershell
docker compose up -d postgres
docker compose --profile db-push run --rm db-push-auth
docker compose --profile db-push run --rm db-push-channel
docker compose --profile db-push run --rm db-push-trend
docker compose --profile db-push run --rm db-push-strategy
docker compose --profile db-push run --rm db-push-planner
docker compose --profile db-push run --rm db-push-analytics
```

Or sync all services in one go:

```powershell
.\scripts\docker-up.ps1 -SkipDbPush:$false
```

Prime trend data after startup:

```powershell
.\scripts\docker-up.ps1 -PrimeTrends
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
