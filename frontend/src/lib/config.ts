/**
 * Single source of truth for the backend base URL.
 *
 * Resolution order:
 *   1. VITE_API_URL          (canonical - documented in README / CI docs)
 *   2. VITE_API_BASE_URL     (legacy name kept for backwards compatibility)
 *   3. "/v1"                 (relative -> resolved by the Vite dev/preview proxy)
 *
 * The value may be relative ("/v1") or absolute ("https://api.ciq.yashparmar.in/v1").
 * Relative URLs keep the browser on the same origin, which removes the CORS
 * preflight from the critical path of the SSE chat stream entirely.
 */
const rawBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/v1';

export const API_BASE_URL: string = rawBase.replace(/\/+$/, '');

export const SSE_CHAT_URL: string = `${API_BASE_URL}/strategy/chat/stream`;

export const STREAM_TIMEOUT_MS = 180_000;
