# CreatorIQ Backend — Microservice Architecture

Containerized FastAPI microservices backend for CreatorIQ. All core services run over the `creatoriq-net` Docker bridge network and share a unified PostgreSQL 16 relational store, Redis 7 atomic key-pool & cache layer, and Qdrant 384-dimensional vector store.

---

## 🏗️ Active Microservices Registry

| Service | Container Name | Port | Health Endpoint | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | `ciq-api-gateway` | `8000` | `GET /health` | Single ingress proxy, RS256 JWT verification (7-day access / 30-day refresh), rate limiting, `X-User-Id` & `X-Session-Id` injection |
| **Auth & Connectors** | `ciq-auth` | `8001` | `GET /auth/health` | User auth, RS256 JWT signing, Fernet AES-128-CBC OAuth token vault, 3-Unit YouTube Deep Sync, YouTube Analytics API v2 measured retention, Google Docs, Google Calendar & Notion API execution |
| **Channel Service** | `ciq-channel` | `8002` | `GET /health` | Creator profile & 7-step onboarding state, 19-niche taxonomy, channel overview metrics, content planner & analytics endpoints |
| **Trend & Strategy** | `ciq-trend` | `8003` | `GET /health` | 4-Gate signal harvester, 384-D `all-MiniLM-L6-v2` + Qdrant clustering, Multi-Attribute TVS & $2\sigma$ outlier scoring, `CopilotAgent` (6-layer context + 14 parallel tools), 3-tier LLM router & `RedisKeyPool` |
| **ML Forecast Engine** | `ciq-ml` | `8007` | `GET /health` | 85-Feature LightGBM Virality Probability Classifier (`ForecastEngine`) & 90-day parametric trajectory projection (`emerging` / `growing` / `peaking` / `declining`) |
| **PostgreSQL 16** | `ciq-postgres` | `5432` | `pg_isready` | Persistent storage for all 14 production relational tables |
| **Redis 7** | `ciq-redis` | `6379` | `redis-cli ping` | Atomic round-robin API key pools (`creatoriq:keypool:*`), per-key `429` cooldown TTLs, and feed snapshot caching |

> **Architectural Consolidation Note:** Strategy (`CopilotAgent`, SSE streaming, long-term memory), Planner integrations, and Trend intelligence are unified inside `ciq-trend (:8003)` to allow zero-latency access to `TrendConcept`, `ConceptDailySignal`, and `ChannelOutlier` tables during autonomous tool execution.

---

## ⚡ Quick Start (Docker — Recommended)

```powershell
cd backend
.\scripts\docker-up.ps1
```

Or run directly with Docker Compose:

```bash
cd backend
docker compose up -d --build
```

**API Gateway Entry Point:** `http://localhost:8000/v1`

---

## 🔑 Multi-Key Pool & Environment Configuration (`backend/.env`)

CreatorIQ uses `RedisKeyPool` (`backend/services/trend/app/core/key_pool.py`) to accept comma-separated pools of API keys for zero-downtime rotation and automatic `429` quarantine:

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google & YouTube OAuth 2.0
- `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET` — Notion OAuth 2.0
- `YOUTUBE_API_KEYS` — Comma-separated YouTube Data API v3 keys (60-min cooldown on `403 quotaExceeded`)
- `SERPAPI_API_KEYS` — Comma-separated SerpApi Google Trends keys (60-min cooldown on `429`)
- `TAVILY_API_KEYS` — Comma-separated Tavily web search keys (30-min cooldown on `429`)
- `GROQ_API_KEYS` — Comma-separated Groq LPU keys for Tier-1 `llama-3.3-70b-versatile` inference (90s cooldown)
- `GEMINI_API_KEYS` — Comma-separated Google Gemini keys for Tier-2 `gemini-2.5-flash` inference (90s cooldown)
- `OPENROUTER_API_KEYS` — Comma-separated OpenRouter keys for Tier-3 `openai/gpt-4o-mini` inference (90s cooldown)
- `AES_ENCRYPTION_KEY` — 32-byte URL-safe base64 Fernet key for encrypting OAuth tokens at rest
- `INTERNAL_SERVICE_TOKEN` — Shared secret (`X-Internal-Service-Token`) for service-to-service RPC calls

Generate a Fernet encryption key:
```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Generate RS256 JWT keypair (`secrets/jwt-private.pem` & `secrets/jwt-public.pem`):
```powershell
.\scripts\generate-jwt-keys.ps1
```

---

## 📖 Detailed Backend Documentation

- **[Master Database Schema (`docs/master_schema.md`)](./docs/master_schema.md)** — Complete 14-table ER diagram and column specifications.
- **[Service Registry & Internal RPC Guide (`docs/service_registry.md`)](./docs/service_registry.md)** — Service responsibilities, headers, and inter-service HTTP contracts.
- **[Algorithms & Mathematical Models (`../docs/ALGORITHMS_AND_MATHEMATICAL_MODELS.md`)](../docs/ALGORITHMS_AND_MATHEMATICAL_MODELS.md)** — Full mathematical specification of all backend pipelines.
- **[Copilot Agent & Connectors Architecture (`../docs/COPILOT_AGENT_AND_CONNECTORS_ARCHITECTURE.md`)](../docs/COPILOT_AGENT_AND_CONNECTORS_ARCHITECTURE.md)** — Deep dive into `CopilotAgent` and OAuth connectors.
