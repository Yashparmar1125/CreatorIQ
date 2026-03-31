# CreatorIQ Backend Microservices Plan (No Kafka/Kinesis)

This backend is organized as independent services so each developer can own one service end-to-end.

## Core Decisions

- Architecture: microservices with synchronous internal HTTP calls only.
- Async broker removed: no Kafka, no Kinesis for v1.
- Communication: REST + internal service-to-service auth.
- Public API entry: API Gateway only.
- Service ownership: one developer per service.

## Services

- `api-gateway` (port `8000`): entrypoint, JWT verification, routing, rate limiting.
- `auth` (port `8001`): registration/login, JWT + refresh token, YouTube OAuth.
- `channel` (port `8002`): channel profile and metrics ingestion/refresh.
- `trend` (port `8003`): trend feed, trend detail, save/unsave.
- `strategy` (port `8004`): idea/title/tag/script generation orchestration.
- `planner` (port `8005`): calendar slot CRUD and scheduling logic.
- `analytics` (port `8006`): analytics videos/summary/benchmarks.
- `ml` (port `8007`): trend forecast and content scoring inference APIs.

## Removed Event-Driven Flows

The PRD references background jobs via Kafka topics. For now:

- replace events with direct API calls between services,
- keep operations request/response oriented,
- use retry + timeout + idempotency keys for reliability.

Examples:

- Channel OAuth callback triggers direct call from `auth -> channel` to ingest/update channel.
- Strategy generation calls `strategy -> ml` directly for scoring.
- Analytics summary generation runs as direct request with cached responses.

## Global Auth Model

- User auth: JWT `RS256` access token (15m) + refresh token rotation.
- External clients call only API Gateway with `Authorization: Bearer <token>`.
- Internal service calls use `X-Internal-Service-Token` (shared secret or signed internal JWT).
- Authorization gates use `plan_tier` claims (`free`, `pro`, `agency`) and resource ownership checks.

## Developer Workflow

Each service folder has a dedicated README with:

- responsibilities and boundaries,
- detailed endpoint list,
- request/response contracts,
- required auth and authorization behavior,
- internal dependencies.

Start from `backend/services/<service>/README.md` and implement only that service scope.

## Docker Infra (Bridge Network)

- Compose file: `backend/docker-compose.yml`
- Network: `creatoriq-net` with Docker `bridge` driver
- Infra containers included:
  - `postgres` (`5432`)
  - `redis` (`6379`)
- Service containers:
  - `api-gateway` (`8000`)
  - `auth` (`8001`)
  - `channel` (`8002`)
  - `trend` (`8003`)
  - `strategy` (`8004`)
  - `planner` (`8005`)
  - `analytics` (`8006`)
  - `ml` (`8007`)

### Run

1. Copy `backend/.env.example` to `backend/.env`.
2. From `backend/`, run:
   - `docker compose up --build`
3. Health checks:
   - `http://localhost:8000/health`
   - `http://localhost:8001/health`
   - `http://localhost:8002/health`
   - `http://localhost:8003/health`
   - `http://localhost:8004/health`
   - `http://localhost:8005/health`
   - `http://localhost:8006/health`
   - `http://localhost:8007/health`

## Database Migrations

Each data-owned service includes Alembic scaffolding under `backend/services/<service>/migrations/`.

Run migrations after `docker compose up --build`:

- `docker exec -it ciq-auth alembic -c alembic.ini upgrade head`
- `docker exec -it ciq-channel alembic -c alembic.ini upgrade head`
- `docker exec -it ciq-trend alembic -c alembic.ini upgrade head`
- `docker exec -it ciq-strategy alembic -c alembic.ini upgrade head`
- `docker exec -it ciq-planner alembic -c alembic.ini upgrade head`
- `docker exec -it ciq-analytics alembic -c alembic.ini upgrade head`
