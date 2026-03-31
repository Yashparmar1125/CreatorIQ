# API Gateway Service (`8000`)

## Purpose

Single public ingress for all client traffic. This service does not own business data; it enforces platform-wide policies and routes requests to domain services.

## Responsibilities

- Verify JWT for protected routes.
- Enforce rate limits per user + endpoint group.
- Attach request metadata (`request_id`, user claims, client IP).
- Route to downstream services (`auth`, `channel`, `trend`, `strategy`, `planner`, `analytics`).
- Standardize response/error envelope.

## Public Routes

### Auth passthrough

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/token/refresh`
- `GET /v1/auth/youtube/oauth-url`
- `POST /v1/auth/youtube/callback`

### Channel

- `GET /v1/channels`
- `GET /v1/channels/{channel_id}/metrics`

### Trend

- `GET /v1/trends`
- `GET /v1/trends/{trend_id}`
- `POST /v1/trends/{trend_id}/save`
- `DELETE /v1/trends/{trend_id}/save`

### Strategy

- `POST /v1/strategy/sessions`
- `GET /v1/strategy/sessions/{session_id}`
- `POST /v1/strategy/sessions/{session_id}/titles`
- `POST /v1/strategy/sessions/{session_id}/tags`
- `POST /v1/strategy/sessions/{session_id}/script`
- `GET /v1/strategy/sessions/{session_id}/script/{script_job_id}`

### Planner

- `GET /v1/planner/slots`
- `POST /v1/planner/slots`
- `PATCH /v1/planner/slots/{id}`
- `DELETE /v1/planner/slots/{id}`

### Analytics

- `GET /v1/analytics/videos`
- `GET /v1/analytics/summary`
- `GET /v1/analytics/benchmarks`

## Auth Rules

- Public endpoints: register/login/refresh can be unauthenticated.
- All other endpoints require valid access token.
- Gateway validates signature, expiry, and required claims (`sub`, `plan_tier`).
- Gateway forwards claims in trusted internal headers (do not trust client-provided versions).

## Service-to-Service Auth

- Gateway to downstream services must include `X-Internal-Service-Token`.
- Downstream services must reject internal calls without valid internal token.

## Definition of Done

- Route table complete and versioned under `/v1`.
- Response envelope consistent for success and error cases.
- Request tracing in logs with `request_id`.
- Rate limit headers present: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
