# ML Service (`8007`)

## Purpose

Serve model inference endpoints to other backend services. This service is internal-only (not exposed to external clients).

## Data Access

- Read-only access to trend/channel feature data as needed.
- Model artifacts loaded from model registry/storage.

## Internal Endpoints

### `POST /internal/ml/trend-forecast`

Forecast trend interest trajectory and confidence bounds.

- Auth: internal service token required
- Callers: `trend`

### `POST /internal/ml/score-idea`

Return predicted performance score for generated idea payload.

- Auth: internal service token required
- Callers: `strategy`

### `POST /internal/ml/score-title-ctr`

Return predicted CTR score for title variant.

- Auth: internal service token required
- Callers: `strategy`

### `GET /internal/ml/health`

Model/serving health endpoint.

- Auth: internal service token required (or infra allowlist)

## Auth Behavior

- Never accept user JWT as authorization for inference calls.
- Only trusted internal callers with service token can access endpoints.
- Log caller service identity for auditability.

## What This Developer Must Build

- Stable inference contract schemas (Pydantic).
- Model loading/version pinning and warm-start behavior.
- Latency instrumentation (`p50`, `p95`, `p99`) and failure metrics.
- Graceful fallback responses for model/timeouts.
