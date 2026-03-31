# Channel Service (`8002`)

## Purpose

Manage channel profiles and channel-level metrics snapshots used by dashboard and analytics flows.

## Data Ownership

- `channels`
- `channel_metrics`
- `audience_snapshots` (if used in v1)

## Endpoints

### `GET /channels`

Return channels visible to authenticated user.

- Auth: required
- Authorization: user can see only own channels

### `GET /channels/{channel_id}/metrics`

Return summary/deltas/sparklines/time_series for date range.

- Auth: required
- Authorization: ownership check on `channel_id`
- Query: `start_date`, `end_date`, `period`

## Internal Endpoints (Service-to-Service)

### `POST /internal/channels/upsert-from-oauth`

Upsert channel record from OAuth payload.

- Auth: internal service token required
- Caller: `auth` service

### `POST /internal/channels/{channel_id}/refresh-metrics`

Fetch latest metrics from YouTube APIs and persist snapshots.

- Auth: internal service token required
- Caller: `auth`, `analytics`, or admin scheduler

## Auth Behavior

- Trust user identity only from verified gateway headers/JWT claims.
- Reject direct public access to internal endpoints.
- Enforce plan limits (example: connected channels cap by `plan_tier`).

## External Integrations

- YouTube Data API
- YouTube Analytics API

## What This Developer Must Build

- Channel CRUD boundaries (within current contract).
- Metrics ingestion and normalization pipelines called by direct APIs.
- Date-range aggregation logic for dashboard metrics endpoint.
- Caching for hot channel metrics queries.
