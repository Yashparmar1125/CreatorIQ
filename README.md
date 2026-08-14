# CreatorIQ

**CreatorIQ** is a premium AI SaaS platform for YouTube creators. It combines **trend discovery**, **AI strategy briefs**, **channel analytics**, and **content planning** in one workspace — personalized to each creator's niche, format, tone, and audience geography.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Trends engine](#trends-engine)
- [API overview](#api-overview)
- [Frontend routes](#frontend-routes)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Roadmap](#roadmap)

---

## Features

### Live today

| Area | Description |
|------|-------------|
| **Auth** | Email/password signup & login, Google OAuth (YouTube channel connect) |
| **Onboarding** | 7-step wizard — connect YouTube, niche, format, tone, geo, profile review |
| **Trends** | Personalized **Top 5** feed ranked by niche fit, momentum, and geography |
| **Trend collectors** | YouTube Data API (primary) + SerpApi Google Trends (secondary) |
| **AI enrichment** | OpenRouter-powered headlines, angles, and title ideas on trend items |
| **Feed history** | Browse past feed snapshots (free) via slide-in drawer |
| **Trend detail** | Deep dive per opportunity + title ideas |
| **Quick strategy** | One-click from any trend card → AI strategy brief |
| **Strategy** | Unified brief: titles, insight, script outline (hook / retention / CTA), SEO tags |
| **Dashboard** | Channel overview, stats, insights panel |
| **Analytics** | Retention, traffic sources, audience breakdown (UI + store) |
| **Planner** | Content calendar scaffold |
| **Marketing** | Landing, product, pricing, insights pages |

### Dev conveniences

- **Unlimited trend refreshes** when `ENVIRONMENT=development`
- Docker Compose stack with health checks and migration runners
- Internal service token for cross-service calls

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React 19, TypeScript, Vite 8, React Router 7, Zustand, TanStack Query, Tailwind CSS 4, Framer Motion, Lucide |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy (async), Alembic, httpx |
| **Data** | PostgreSQL 16, Redis 7 |
| **AI** | OpenRouter (GPT-4o-mini or compatible models) |
| **External APIs** | YouTube Data API, SerpApi, Google OAuth |
| **Infra** | Docker Compose, API Gateway (JWT verification + proxy) |

---

## Repository structure

```
CreatorIQ/
├── README.md                 # This file
├── docs/                     # Product & engine specs
│   ├── TRENDS_ENGINE_SPEC.md
│   └── ONBOARDING_PIPELINE_PLAN.md
├── backend/
│   ├── .env.example          # Copy to .env and fill secrets
│   ├── docker-compose.yml    # Full microservices stack
│   ├── scripts/
│   │   ├── docker-up.ps1     # One-command backend bootstrap
│   │   └── generate-jwt-keys.ps1
│   ├── secrets/              # JWT keys (generated, gitignored)
│   └── services/
│       ├── api-gateway/      # :8000 — public entry point
│       ├── auth/             # :8001 — users, JWT, OAuth
│       ├── channel/          # :8002 — YouTube channels, creator profiles
│       ├── trend/            # :8003 — trends engine, feeds, concepts
│       ├── strategy/         # :8004 — AI content briefs
│       ├── planner/          # :8005 — content calendar
│       ├── analytics/        # :8006 — channel analytics
│       └── ml/               # :8007 — scoring / forecasts
└── frontend/
    ├── src/
    │   ├── features/         # dashboard, trends, strategy, planner, analytics, onboarding
    │   ├── components/       # ui/, marketing/, organisms/
    │   ├── layouts/            # MainLayout, PublicLayout
    │   ├── pages/              # Landing, Auth, Pricing, etc.
    │   └── stores/             # Zustand stores
    └── package.json
```

---

## Prerequisites

- **Docker Desktop** (Windows / macOS / Linux)
- **Node.js 20+** and **npm** (for frontend)
- **PowerShell** (for `docker-up.ps1` on Windows)
- API keys (see [Configuration](#configuration)):
  - Google OAuth (sign-in + YouTube)
  - YouTube Data API key (trend video signals)
  - SerpApi key (Google Trends supplement)
  - OpenRouter key (AI strategy + trend enrichment)

---

## Quick start

### 1. Backend (Docker)

```powershell
cd backend
.\scripts\docker-up.ps1
```

This script:

1. Generates JWT keys in `backend/secrets/` (if missing)
2. Copies `.env.example` → `.env` if needed
3. Builds all service images
4. Starts Postgres + Redis
5. Runs Alembic migrations for all services
6. Starts all microservices + API gateway
7. Runs health checks

**API base URL:** `http://localhost:8000/v1`

Verify:

```powershell
curl http://localhost:8000/health
```

### 2. Frontend

```powershell
cd frontend
npm install
```

Create `frontend/.env` (or `.env.local`):

```env
VITE_API_URL=http://localhost:8000/v1
```

```powershell
npm run dev
```
..
**App URL:** `http://localhost:5173`

### 3. First-time user flow

1. Open `http://localhost:5173/signup`
2. Create an account or sign in with Google / YouTube
3. Complete onboarding (connect channel, pick niche, format, tone, country)
4. Land on **Trends** — first personalized Top 5 feed is generated automatically
5. Click **Strategy** on a trend card for an AI brief

---

## Configuration

Copy and edit `backend/.env`:

```powershell
cd backend
copy .env.example .env
```

### Required for core functionality

| Variable | Purpose |
|----------|---------|
| `INTERNAL_SERVICE_TOKEN` | Shared secret between microservices (must match everywhere) |
| `AES_ENCRYPTION_KEY` | Fernet key for encrypting OAuth tokens at rest |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `YOUTUBE_API_KEY` | YouTube Data API — primary trend video collector |
| `SERPAPI_API_KEY` | SerpApi — Google Trends supplement |
| `OPENROUTER_API_KEY` | AI strategy briefs + trend enrichment |
| `MODEL_NAME` | OpenRouter model slug (default: `openai/gpt-4o-mini`) |

Generate Fernet key:

```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Generate JWT keys:

```powershell
cd backend
.\scripts\generate-jwt-keys.ps1
```

### Google Cloud Console

Add OAuth redirect URI:

```
http://localhost:8000/v1/auth/google/callback
```

Enable APIs: **YouTube Data API v3**, **YouTube Analytics API** (for analytics features).

> **Note:** `docker-compose.yml` overrides `DATABASE_URL`, `REDIS_URL`, and inter-service URLs to use Docker internal hostnames. Local `.env` values for those are ignored when running via Compose.

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────────┐
│  Frontend   │────▶│  API Gateway     │────▶│  Auth / Channel / Trend /   │
│  :5173      │     │  :8000           │     │  Strategy / Planner /       │
└─────────────┘     └──────────────────┘     │  Analytics / ML             │
                              │               └───────────┬─────────────────┘
                              │                           │
                              ▼                           ▼
                     ┌────────────────┐          ┌───────────────┐
                     │  JWT verify    │          │  PostgreSQL   │
                     │  + route proxy │          │  Redis        │
                     └────────────────┘          └───────────────┘
```

- **API Gateway** validates JWTs and forwards trusted user headers (`X-User-Id`, `X-Plan-Tier`) to downstream services.
- Each service owns its schema and Alembic migrations.
- Internal endpoints use `X-Internal-Service-Token` — never exposed to the browser.

### Service ports

| Service | Port | Health check |
|---------|------|--------------|
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

---

## Trends engine

The trends engine (Phase 1–2) powers personalized opportunity feeds.

### Data model

| Table | Purpose |
|-------|---------|
| `trend_concepts` | Canonical trend topics with niche tags, velocity, lifecycle |
| `concept_signals` | Raw signals from YouTube / SerpApi per concept |
| `trend_feed_snapshots` | User Top 5 snapshots (history) |
| `user_feed_credits` | Monthly refresh credits (bypassed in dev) |

### Signal pipeline

1. **Background collector** — runs niche cluster queries (Entertainment, Gaming, Finance, Tech, …)
2. **YouTube video collector** — real video velocity via YouTube Data API (primary)
3. **SerpApi** — Google Trends supplement
4. **Quality filters** — reject news junk; require creator-topic signals (including finance keywords)
5. **Scoring** — niche fit, geo relevance, momentum, stability, saturation
6. **AI enrichment** — OpenRouter adds headline, angle, growth tip per item
7. **Feed snapshot** — Top 5 saved per user; history browsable for free

### Supported niches (collectors)

Entertainment, Gaming, Tech, Education, Fitness, **Finance**, Cooking, Music, Travel, Beauty — see `backend/services/trend/app/services/niche_taxonomy.py`.

### Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/trends` | Latest Top 5 (auto-generates first feed if none) |
| `POST` | `/trends/refresh` | Credit-gated refresh (unlimited in dev) |
| `GET` | `/trends/history` | List past feed snapshots |
| `GET` | `/trends/history/{feed_id}` | Full historical snapshot |
| `GET` | `/trends/{trend_id}` | Trend detail + title ideas |
| `POST` | `/trends/{trend_id}/save` | Save trend |
| `DELETE` | `/trends/{trend_id}/save` | Unsave trend |

### Internal (ops)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/internal/trends/collect` | Run all niche collectors |
| `POST` | `/internal/trends/feeds/generate-first` | Generate first feed for a user |

---

## API overview

All public routes are prefixed with `/v1` on the gateway.

| Prefix | Service | Examples |
|--------|---------|----------|
| `/auth/*` | Auth | `POST /auth/register`, `POST /auth/login`, Google OAuth |
| `/channels/*` | Channel | `GET /channels/me`, `GET /channels/profile` |
| `/trends/*` | Trend | See above |
| `/strategy/*` | Strategy | `POST /strategy/generate-brief` |
| `/planner/*` | Planner | Calendar CRUD |
| `/analytics/*` | Analytics | Channel metrics |

Auth: `Authorization: Bearer <access_token>` on protected routes.

---

## Frontend routes

### Public

| Path | Page |
|------|------|
| `/` | Landing |
| `/product` | Product |
| `/pricing` | Pricing |
| `/insights` | Insights |
| `/login`, `/signup` | Auth |
| `/onboarding` | Onboarding wizard |
| `/privacy`, `/terms` | Legal |

### App (authenticated)

| Path | Page |
|------|------|
| `/app/dashboard` | Dashboard |
| `/app/trends` | Personalized trend feed |
| `/app/trends/detail/:trendId` | Trend detail |
| `/app/strategy` | AI strategy briefs |
| `/app/planner` | Content planner |
| `/app/analytics` | Analytics |
| `/app/settings` | Settings |

### Frontend architecture

- **State:** Zustand (`useAuthStore`, `useTrendsStore`, `useStrategyStore`, …)
- **API:** Axios client with JWT interceptor + refresh (`src/lib/api.ts`)
- **Design system:** `src/components/ui/` — Card, Button, Badge, PageHeader, StatCard, etc.
- **Styling:** Tailwind CSS 4 with custom surface tokens (`surface-app`, `surface-glass`, …)

---

## Development

### Backend commands

```powershell
cd backend

# View logs
docker compose logs -f api-gateway
docker compose logs -f trend
docker compose logs -f strategy

# Rebuild one service after code changes
docker compose build trend
docker restart ciq-trend

# Run migrations only
docker compose --profile migrate run --rm migrate-trend

# Fresh database (destructive)
docker compose down -v
.\scripts\docker-up.ps1
```

### Frontend commands

```powershell
cd frontend
npm run dev      # Dev server :5173
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Run trend collector manually

```powershell
curl -X POST http://localhost:8003/internal/trends/collect `
  -H "X-Internal-Service-Token: <your-token>"
```

### Trigger first feed for a user

```powershell
curl -X POST http://localhost:8003/internal/trends/feeds/generate-first `
  -H "Content-Type: application/json" `
  -H "X-Internal-Service-Token: <your-token>" `
  -d '{"user_id":"<uuid>"}'
```

---

## Troubleshooting

### Strategy returns 500 or empty brief

- **Cause:** OpenRouter rate limit (`429`) or free model returning empty JSON.
- **Fix:** Use `MODEL_NAME=openai/gpt-4o-mini` in `.env`, restart `ciq-strategy`. The service falls back to a template brief when the LLM is unavailable.

### Trends feed empty or only 1–2 items

- **Cause:** YouTube API quota (`429`) or few concepts passing quality filters for your niche.
- **Fix:** Run collector (`POST /internal/trends/collect`), wait for quota reset, or broaden niche tags on profile.

### `INVALID_INTERNAL_TOKEN`

- Ensure `INTERNAL_SERVICE_TOKEN` in `.env` matches what containers use (`docker exec ciq-trend printenv INTERNAL_SERVICE_TOKEN`).

### OAuth redirect mismatch

- Redirect URI must be exactly `http://localhost:8000/v1/auth/google/callback` in Google Cloud Console.

### Frontend can't reach API

- Confirm `VITE_API_URL=http://localhost:8000/v1` in `frontend/.env`.
- Confirm gateway is up: `curl http://localhost:8000/health`.

### Changes not reflected in Docker

- Rebuild and restart the affected service:
  ```powershell
  docker compose build strategy && docker restart ciq-strategy
  ```

---

## Documentation

| Document | Description |
|----------|-------------|
| [backend/README.md](backend/README.md) | Backend Docker setup details |
| [docs/TRENDS_ENGINE_SPEC.md](docs/TRENDS_ENGINE_SPEC.md) | Trends engine product spec |
| [docs/ONBOARDING_PIPELINE_PLAN.md](docs/ONBOARDING_PIPELINE_PLAN.md) | Onboarding pipeline design |
| [backend/docs/authentication.md](backend/docs/authentication.md) | Auth flows |
| [backend/docs/master_schema.md](backend/docs/master_schema.md) | Database schema overview |
| Per-service READMEs | `backend/services/*/README.md` |

---

## Roadmap

| Phase | Status | Items |
|-------|--------|-------|
| **Phase 1** | Done | Concept store, collectors, Top 5 feed, refresh API, first free feed |
| **Phase 2** | Done | Feed history, trend detail, quick strategy action |
| **Phase 3** | Planned | Production credits, planner ↔ strategy integration, "I made this" tracking |
| **UI** | Ongoing | Premium polish on Planner, Settings, Product pages |
| **Analytics** | Partial | Wire real YouTube Analytics geo for audience weighting |

---

## License

Proprietary — All rights reserved.
