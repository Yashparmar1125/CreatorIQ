# Auth Service (`8001`)

## Purpose

Own user identity, session lifecycle, refresh token rotation, and YouTube OAuth integration.

## Data Ownership

- `users`
- `oauth_tokens`
- `sessions`

## Endpoints

### `POST /auth/register`

Create user with email/password/full_name.

- Auth: none
- Returns: `user`, `access_token`, `refresh_token`

### `POST /auth/login`

Authenticate user and issue tokens.

- Auth: none
- Returns: `user`, `access_token`, `refresh_token`

### `POST /auth/token/refresh`

Rotate refresh token and issue new pair.

- Auth: none (refresh token body required)
- Security: detect token reuse and revoke all sessions on violation

### `GET /auth/youtube/oauth-url`

Return OAuth URL for YouTube consent flow.

- Auth: required
- Query: optional `channel_id` for reconnect

### `POST /auth/youtube/callback`

Consume OAuth `code` + `state`, store encrypted OAuth tokens, ingest channel.

- Auth: required
- Side effect (no Kafka): direct internal call to `channel` service for channel upsert + initial metrics sync

## Auth Behavior

- Issue JWT access token (`RS256`, 15 minutes).
- Issue opaque refresh token (90 days), store hashed, rotate on every use.
- Include claims: `sub`, `email`, `plan_tier`, `channels`, `iat`, `exp`.
- Enforce login abuse controls (failed-attempt lockouts/rate limit).

## Internal Dependencies

- Calls `channel` service on OAuth callback completion:
  - `POST /internal/channels/upsert-from-oauth`
  - `POST /internal/channels/{channel_id}/refresh-metrics`

## What This Developer Must Build

- Full auth and token lifecycle, including rotation and reuse detection.
- OAuth state + PKCE validation.
- Encryption/decryption of OAuth tokens at rest.
- Internal client to `channel` service with retries and timeout.
- Security-safe logging (never log tokens/passwords).
