# Planner Service (`8005`)

## Purpose

Own content calendar slots and publish schedule workflows.

## Data Ownership

- `planner_slots`
- `posting_time_data` (if maintained here)

## Endpoints

### `GET /planner/slots`

Fetch slots by channel and date range plus optional optimal time suggestions.

- Auth: required
- Query: `channel_id`, `start_date`, `end_date`

### `POST /planner/slots`

Create slot.

- Auth: required

### `PATCH /planner/slots/{id}`

Update mutable slot fields.

- Auth: required
- Authorization: owner-only

### `DELETE /planner/slots/{id}`

Soft-delete slot.

- Auth: required
- Response: `204 No Content`

## Auth Behavior

- Require valid JWT on all endpoints.
- Enforce ownership by `user_id` + `channel_id` mapping.
- Use plan tier only for optional limits (e.g., slot caps if needed).

## Internal Dependencies

- Optional read calls to `channel` for audience activity windows:
  - `GET /internal/channels/{channel_id}/optimal-times`

## What This Developer Must Build

- Slot CRUD with soft delete.
- Calendar-range query performance (indexed by `channel_id`, `scheduled_at`).
- Validation rules (no past scheduling, valid status transitions).
- Optional conflict detection for overlapping planned slots.
