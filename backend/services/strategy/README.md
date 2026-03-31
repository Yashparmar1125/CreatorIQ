# Strategy Service (`8004`)

## Purpose

Generate content strategy artifacts (ideas, titles, tags, script outlines) with ML scoring and plan-tier controls.

## Data Ownership

- `strategy_sessions`
- `generated_content`
- `briefs` (if materialized separately)

## Endpoints

### `POST /strategy/sessions`

Create generation session and run idea generation pipeline.

- Auth: required
- Returns: `session_id`, `status`, `estimated_seconds`
- Note: in no-broker mode, process synchronously or with internal background task queue local to service

### `GET /strategy/sessions/{session_id}`

Return session + generated ideas.

- Auth: required
- Authorization: owner-only access

### `POST /strategy/sessions/{session_id}/titles`

Generate title variants for selected idea.

- Auth: required

### `POST /strategy/sessions/{session_id}/tags`

Generate tags for selected title.

- Auth: required

### `POST /strategy/sessions/{session_id}/script`

Generate script outline (plan-gated).

- Auth: required
- Authorization: `pro`/`agency` only

### `GET /strategy/sessions/{session_id}/script/{script_job_id}`

Get script job output/status.

- Auth: required

## Auth Behavior

- Resource ownership is mandatory for all session resources.
- Plan gating:
  - free: ideas only (or limited sessions)
  - pro/agency: titles/tags/script features per policy
- Reject unauthorized access with `403 FORBIDDEN` + explicit code.

## Internal Dependencies

- Calls `ml` service for scoring:
  - `POST /internal/ml/score-idea`
  - `POST /internal/ml/score-title-ctr`

## What This Developer Must Build

- Session lifecycle state machine (`pending`, `generating`, `complete`, `failed`).
- LLM orchestration with retries/timeouts and structured JSON validation.
- Title/tag/script generators with cached regeneration support.
- Plan-based access checks at handler and service layer.
