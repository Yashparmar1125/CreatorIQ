# Analytics Service (`8006`)

## Purpose

Serve performance analytics views and AI summaries from channel metrics and derived aggregates.

## Data Ownership

- `analytics_snapshots`
- `benchmarks`
- `ai_summaries`

## Endpoints

### `GET /analytics/videos`

Video-level analytics list with sorting and pagination.

- Auth: required
- Query: `channel_id`, `start_date`, `end_date`, `sort`, `order`, `cursor`, `limit`

### `GET /analytics/summary`

AI summary + recommendations for channel/date range.

- Auth: required
- Cache summary by `(channel_id, start_date, end_date)` with TTL

### `GET /analytics/benchmarks`

Niche benchmark distribution and channel percentile.

- Auth: required
- Query: `channel_id`, `niche`

## Internal Endpoints

### `POST /internal/analytics/rebuild-summary`

Recompute and cache summary for date range.

- Auth: internal service token required

## Auth Behavior

- User must own referenced `channel_id`.
- Enforce plan gating on premium exports or advanced benchmark scopes.
- Internal-only endpoints require internal token.

## Internal Dependencies

- Pull raw/aggregated metrics from `channel` service (internal API).
- Optionally call LLM gateway for narrative summary generation.

## What This Developer Must Build

- Efficient analytical queries for date ranges up to 90 days.
- AI summary generation pipeline with safe retries/fallback.
- Benchmark aggregation APIs with anonymized output only.
- Cache strategy for heavy endpoints.
