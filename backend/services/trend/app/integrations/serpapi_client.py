"""
SerpApi Google Trends clients with Multi-Key Pool & Automatic 429 Failover.
  - search_google_trends()       → engine: google_trends (RELATED_QUERIES etc.)
  - search_trending_now()        → engine: google_trends_trending_now  ← primary
"""

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class SerpApiKeyPool:
    """Thread-safe key pool for SerpApi with automatic 429 failover."""

    def __init__(self) -> None:
        self._keys: list[str] = []
        self._exhausted_keys: set[str] = set()
        self._current_idx: int = 0
        self._reload_keys()

    def _reload_keys(self) -> None:
        raw = f"{settings.serpapi_api_keys},{settings.serpapi_api_key}".strip(",")
        keys: list[str] = []
        for k in raw.split(","):
            clean = k.strip()
            if clean and clean not in keys:
                keys.append(clean)
        self._keys = keys

    def get_keys(self) -> list[str]:
        if not self._keys:
            self._reload_keys()
        return list(self._keys)

    def get_active_key(self) -> str | None:
        if not self._keys:
            self._reload_keys()
        available = [k for k in self._keys if k not in self._exhausted_keys]
        if not available:
            if self._keys:
                logger.warning("All SerpApi keys were marked exhausted; resetting pool.")
                self._exhausted_keys.clear()
                available = list(self._keys)
            else:
                return None
        key = available[self._current_idx % len(available)]
        self._current_idx += 1
        return key

    def mark_exhausted(self, key: str) -> None:
        self._exhausted_keys.add(key)
        logger.warning(
            "SerpApi key ...%s marked exhausted (total exhausted: %d/%d).",
            key[-6:],
            len(self._exhausted_keys),
            len(self._keys),
        )


serpapi_pool = SerpApiKeyPool()


async def search_google_trends(
    *,
    q: str,
    data_type: str = "RELATED_QUERIES",
    geo: str = "",
    hl: str = "en",
    date: str = "today 3-m",
    gprop: str = "youtube",
) -> dict[str, Any]:
    """Legacy: keyword-based RELATED_QUERIES call. Kept for the debug proxy endpoint."""
    keys = serpapi_pool.get_keys()
    if not keys:
        raise RuntimeError("SERPAPI_API_KEY / SERPAPI_API_KEYS not set")

    max_attempts = len(keys)
    last_err: Exception | None = None

    async with httpx.AsyncClient(timeout=60.0) as client:
        for _ in range(max_attempts):
            key = serpapi_pool.get_active_key()
            if not key:
                break
            params: dict[str, Any] = {
                "engine": "google_trends",
                "api_key": key,
                "q": q,
                "data_type": data_type,
                "hl": hl,
                "date": date,
            }
            if geo:
                params["geo"] = geo
            if gprop:
                params["gprop"] = gprop

            try:
                r = await client.get(settings.serpapi_base_url, params=params)
                if r.status_code == 429 or "Your monthly searches limit has been reached" in r.text:
                    serpapi_pool.mark_exhausted(key)
                    continue
                r.raise_for_status()
                return r.json()
            except Exception as exc:
                last_err = exc
                if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 429:
                    serpapi_pool.mark_exhausted(key)
                    continue
                raise

    if last_err:
        raise last_err
    raise RuntimeError("All SerpApi keys exhausted")


async def search_trending_now(
    *,
    geo: str = "IN",
    hours: str = "24",
    category_id: str = "4",
    hl: str = "en",
) -> dict[str, Any]:
    """
    Real-time trending topics via Google Trends Trending Now engine.

    Parameters
    ----------
    geo         : ISO country code  (e.g. "IN", "US")
    hours       : time window       ("4" | "24" | "48" | "168")
    category_id : Google Trends category ID
                  4  = Computers & Electronics (Tech/AI)
                  8  = Games
                  3  = Arts & Entertainment
                  7  = Finance
                  20 = Jobs & Education
                  45 = Health
                  0  = All topics
    hl          : language code
    """
    keys = serpapi_pool.get_keys()
    if not keys:
        raise RuntimeError("SERPAPI_API_KEY / SERPAPI_API_KEYS not set")

    max_attempts = len(keys)
    last_err: Exception | None = None

    async with httpx.AsyncClient(timeout=60.0) as client:
        for _ in range(max_attempts):
            key = serpapi_pool.get_active_key()
            if not key:
                break
            params: dict[str, Any] = {
                "engine": "google_trends_trending_now",
                "api_key": key,
                "geo": geo,
                "hours": hours,
                "hl": hl,
            }
            if category_id and str(category_id) != "0":
                params["category_id"] = str(category_id)
            try:
                r = await client.get(settings.serpapi_base_url, params=params)
                if r.status_code == 429 or "Your monthly searches limit has been reached" in r.text:
                    serpapi_pool.mark_exhausted(key)
                    continue
                r.raise_for_status()
                return r.json()
            except Exception as exc:
                last_err = exc
                if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 429:
                    serpapi_pool.mark_exhausted(key)
                    continue
                raise

    if last_err:
        raise last_err
    raise RuntimeError("All SerpApi keys exhausted")
