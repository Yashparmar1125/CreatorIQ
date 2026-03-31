# Trend Service (`8003`)

## Purpose

Provide trend discovery, trend detail analytics, and user save/unsave operations.

## Data Ownership

- `trends`
- `trend_signals`
- `saved_trends`

## Endpoints

### `GET /trends`

Trend feed with filters and cursor pagination.

- Auth: required
- Query: `niches`, `tvs_min`, `tvs_max`, `status`, `window`, `confidence`, `cursor`, `limit`

### `GET /trends/{trend_id}`

Trend detail with history + forecast + competitor signals.

- Auth: required

### `POST /trends/{trend_id}/save`

Save trend for current user.

- Auth: required

### `DELETE /trends/{trend_id}/save`

Unsave trend for current user.

- Auth: required

## Internal Endpoints (No Broker)

### `POST /internal/trends/ingest`

Accept normalized trend signals from ingestion runner.

- Auth: internal service token required

### `POST /internal/trends/{trend_id}/recompute-score`

Recompute TVS and status for one trend.

- Auth: internal service token required
- Optionally call `ml` service for forecast refresh

## Auth Behavior

- User-scoped saved trends keyed by `user_id` claim.
- Enforce plan limits on feed depth (free vs pro/agency).
- Internal endpoints protected by internal token; never exposed publicly.

## Internal Dependencies

- Calls `ml` service for trend forecast inference:
  - `POST /internal/ml/trend-forecast`

## What This Developer Must Build

- Filterable, paginated trend feed with indexed queries.
- Trend detail assembly (signals, forecast, keyword cluster, competitor videos).
- Save/unsave idempotency.
- Synchronous ingestion endpoint replacing Kafka ingestion events.
