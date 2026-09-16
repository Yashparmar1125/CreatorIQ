# CreatorIQ — Developer Setup Guide

Welcome to the **CreatorIQ** developer documentation. This guide walks you through setting up, running, debugging, and testing the entire CreatorIQ stack locally for development.

---

## 1. System Architecture Overview

CreatorIQ is a microservice-based AI platform for YouTube creators that couples real-time video trend harvesting with vector similarity personalization (Qdrant) and Prophet time-series forecasting.

```
                     ┌───────────────────────┐
                     │   React 19 Frontend   │ (:5173)
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   API Gateway (FastAPI)│ (:8000)
                     └─────┬───────────┬─────┘
           ┌───────────────┼───────────┼───────────────┐
           ▼               ▼           ▼               ▼
     ┌───────────┐   ┌───────────┐ ┌───────────┐ ┌───────────┐
     │   Auth    │   │  Channel  │ │   Trend   │ │    ML     │
     │  (:8001)  │   │  (:8002)  │ │  (:8003)  │ │  (:8007)  │
     └─────┬─────┘   └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
           │               │             │             │
           └───────────────┼─────────────┴─────────────┘
                           ▼
              ┌────────────────────────┐
              │  Postgres 16 (:5432)   │
              │  Redis 7     (:6379)   │
              │  Qdrant      (:6333)   │
              └────────────────────────┘
```

### Active Microservices & Ports

| Service | Port | Directory | Description |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8000` | `backend/services/api-gateway` | Reverse proxy, JWT bearer verification, public routing |
| **Auth Service** | `8001` | `backend/services/auth` | User registration, login, JWT issuance, onboarding completion |
| **Channel Service** | `8002` | `backend/services/channel` | Channel profiling, manual context pipeline, tier calibration |
| **Trend Service** | `8003` | `backend/services/trend` | Trend harvesting (YouTube/SerpApi), vector indexing, ranking |
| **ML Service** | `8007` | `backend/services/ml` | Prophet time-series forecasting, view expectation modelling |
| **PostgreSQL 16** | `5432` | Container `ciq-postgres` | Relational storage for users, channels, trend snapshots |
| **Redis 7** | `6379` | Container `ciq-redis` | Cache layer, rate limiting, task queues |
| **Qdrant Vector DB** | `6333` | Container `ciq-qdrant` | Vector similarity embeddings for topic/niche matching |
| **Frontend Web** | `5173` | `frontend/` | React 19, TypeScript, Tailwind CSS 4, Vite |

> **Note on Architecture**: CreatorIQ uses **100% manual creator onboarding** (channel name, handle, subscriber tier/count, niches, content format, tone, and audience country). No user YouTube OAuth or Google API credentials are required from creators. Public trend signals are collected in the background using a public YouTube Data API v3 key and SerpApi.

---

## 2. Prerequisites

Ensure the following tools are installed on your machine:

1. **Git**: Version 2.30+
2. **Node.js**: Version 18.x or 20.x+ & **npm** (for the frontend)
3. **Python**: Version 3.11 or 3.12 (for bare-metal backend development)
4. **Docker Desktop**: Version 4.20+ (with Docker Compose v2 enabled)
5. **OpenSSL** or **PowerShell**: For generating RSA key pairs for JWT signing

---

## 3. Environment Configuration

### Backend Environment Variables

1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   # On Windows PowerShell:
   Copy-Item .env.example .env
   ```
3. Inspect and configure `backend/.env`:

```env
ENVIRONMENT=development
LOG_LEVEL=INFO

# --- Database & Cache ---
DATABASE_URL=postgresql+asyncpg://creatoriq:creatoriq@localhost:5432/creatoriq
REDIS_URL=redis://localhost:6379/0
QDRANT_URL=http://localhost:6333

# --- JWT Signing (RSA256) ---
JWT_ISSUER=creatoriq-auth
JWT_AUDIENCE=creatoriq-api
JWT_PUBLIC_KEY_PATH=secrets/jwt_public.pem
JWT_PRIVATE_KEY_PATH=secrets/jwt_private.pem

# --- Inter-service Auth ---
INTERNAL_SERVICE_TOKEN=local-dev-internal-token
AES_ENCRYPTION_KEY=WDKoTVeDqkigRBrzrrJ-pZ4j6qcUguac_zFtDHJgqKE=

# --- Inter-service URLs (bare-metal ports) ---
AUTH_SERVICE_URL=http://127.0.0.1:8001
CHANNEL_SERVICE_URL=http://127.0.0.1:8002
TREND_SERVICE_URL=http://127.0.0.1:8003
ML_SERVICE_URL=http://127.0.0.1:8007

FRONTEND_URL=http://localhost:5173

# --- External Trend Signals (Optional for initial boot, required for live trend ingestion) ---
YOUTUBE_API_KEY=your_youtube_api_key_here
SERPAPI_API_KEY=your_serpapi_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
MODEL_NAME=openai/gpt-4o-mini
```

> **Important**: When running under Docker Compose, `docker-compose.yml` automatically maps `DATABASE_URL`, `REDIS_URL`, and service hostnames to their respective Docker container names (`postgres`, `redis`, `auth`, etc.).

### Generating JWT RSA Keys

CreatorIQ uses asymmetric RSA (RS256) keys to sign and verify user JWTs. The private key is used exclusively by `auth` to sign tokens; the public key is shared with `api-gateway` to verify them.

**Option A (PowerShell / Windows)**:
```powershell
.\backend\scripts\generate-jwt-keys.ps1
```

**Option B (Bash / Linux / macOS with OpenSSL)**:
```bash
mkdir -p backend/secrets
openssl genrsa -out backend/secrets/jwt_private.pem 2048
openssl rsa -in backend/secrets/jwt_private.pem -pubout -out backend/secrets/jwt_public.pem
chmod 600 backend/secrets/jwt_private.pem
```

---

## 4. Running CreatorIQ with Docker (Recommended)

Docker Compose starts the entire microservices mesh, backing datastores, and schema sync runners with a single command.

### Automated Boot (PowerShell)

From the project root:
```powershell
.\backend\scripts\docker-up.ps1
```

The script will automatically:
1. Generate JWT keys if missing.
2. Build all service Docker images (`auth`, `channel`, `trend`, `ml`, `api-gateway`).
3. Start `postgres`, `redis`, and `qdrant`.
4. Run schema sync runners (`db-push-auth`, `db-push-channel`, `db-push-trend`).
5. Start all application microservices.
6. Verify health check endpoints across the stack.

### Manual Docker Compose Commands

If you prefer standard Docker CLI commands:

```bash
cd backend

# 1. Start backing datastores
docker compose up -d postgres redis qdrant

# 2. Wait for postgres to be healthy, then push database schemas
docker compose --profile db-push run --rm db-push-auth
docker compose --profile db-push run --rm db-push-channel
docker compose --profile db-push run --rm db-push-trend

# 3. Start all backend services
docker compose up -d

# 4. View running container logs
docker compose logs -f api-gateway
```

### Validating Docker Stack Health

Run a curl or browser request to the Gateway full health endpoint:
```bash
curl http://localhost:8000/health/services
```
Expected response:
```json
{
  "status": "ok",
  "services": {
    "gateway": { "status": "ok", "service": "api-gateway" },
    "auth": { "status": "ok", "service": "auth" },
    "channel": { "status": "ok", "service": "channel" },
    "trend": { "status": "ok", "service": "trend" },
    "ml": { "status": "ok", "service": "ml" }
  }
}
```

---

## 5. Running the Frontend

The frontend is built with React 19, TypeScript, and Vite.

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Verify or create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:8000/v1
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173`.

---

## 6. Running Bare-Metal / Local Python (Without Docker for Backend)

If you are developing or debugging a specific backend service (e.g. stepping through breakpoints with VS Code / Cursor debugger):

### 1. Run only datastores in Docker:
```bash
cd backend
docker compose up -d postgres redis qdrant
```

### 2. Create and activate a Python virtual environment:
```bash
python -m venv .venv

# Windows:
.venv\Scripts\Activate.ps1

# Linux / macOS:
source .venv/bin/activate
```

### 3. Install dependencies for the target service:
For example, for the `channel` service:
```bash
pip install -r backend/services/channel/requirements.txt
```

### 4. Push database schema:
```bash
cd backend/services/channel
python -m app.db_push
```

### 5. Run the service with Uvicorn:
```bash
cd backend/services/channel
uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

---

## 7. Verifying the End-to-End User Flow

To verify that the complete system is functioning:

1. **Sign Up**:
   - Go to `http://localhost:5173/signup`.
   - Enter your name, email, and password.
2. **5-Step Onboarding**:
   - **Step 1 (Welcome)**: Click "Get started".
   - **Step 2 (Channel Details)**: Enter a Channel Name (e.g., `Tech Insights`) and handle (e.g., `@techinsights`). Choose a subscriber tier (e.g. `10K - 100K`).
   - **Step 3 (Niches)**: Select 1 to 3 categories (e.g., `Tech`, `AI`, `Education`).
   - **Step 4 (Preferences)**: Select Primary Format (`Hybrid`), Frequency (`Weekly`), Tone (`Informative`), and Target Audience (`India` or `United States`).
   - **Step 5 (Review)**: Review the calibrated profile and click "Complete setup".
3. **Trends Feed**:
   - Navigate to `http://localhost:5173/app/trends`.
   - You will see the personalized Top 15 opportunities ranked with vector similarity and momentum scores.
4. **Prophet Chart & View Estimation**:
   - Click on any trend card to open its detail page (`/app/trends/detail/:id`).
   - Observe the 30-day Prophet time-series curve and the View Possibility Calculator calibrated against your channel's subscriber tier.

---

## 8. Common Troubleshooting & FAQs

### Q: `docker compose up` fails with port conflicts (5432 or 6379 already in use)?
**A**: You likely have a local installation of PostgreSQL or Redis running as a Windows/Linux service. Stop the local service before running Docker:
```powershell
# Windows
Stop-Service postgresql* -Force
```
Or edit `backend/docker-compose.yml` to map to a different host port (e.g. `"5433:5432"`).

### Q: Database schema is missing tables after starting Docker?
**A**: Run the schema push runners manually:
```bash
docker compose --profile db-push run --rm db-push-auth
docker compose --profile db-push run --rm db-push-channel
docker compose --profile db-push run --rm db-push-trend
```

### Q: How do I seed initial trend data?
**A**: Trigger the internal trend harvester endpoint:
```powershell
$token = "local-dev-internal-token"
Invoke-RestMethod -Uri "http://localhost:8003/internal/trends/collect" -Method POST -Headers @{ "X-Internal-Service-Token" = $token }
```
Or run the docker-up script with the `-PrimeTrends` flag:
```powershell
.\backend\scripts\docker-up.ps1 -PrimeTrends
```

### Q: How to completely reset the database to a fresh state?
```bash
cd backend
docker compose down -v
.\scripts\docker-up.ps1
```

---

## 9. Useful Development Commands

| Action | Command |
| :--- | :--- |
| **Verify Python Syntax** | `python -m py_compile backend/services/auth/app/main.py` |
| **Run Frontend Build** | `cd frontend && npm run build` |
| **Validate Compose File** | `cd backend && docker compose config` |
| **Restart a single service** | `docker compose restart trend` |
| **Follow service logs** | `docker compose logs -f trend` |
| **Stop entire stack** | `docker compose down` |
