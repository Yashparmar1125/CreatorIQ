"""
SerpApi Google Trends clients with Redis-Backed Multi-Key Pool & Automatic 429 Failover.
  - search_google_trends()       → engine: google_trends (RELATED_QUERIES etc.)
  - search_trending_now()        → engine: google_trends_trending_now  ← primary
"""

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.core.key_pool import serpapi_pool

logger = logging.getLogger(__name__)


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
    keys = serpapi_pool.get_all_keys()
    if not keys:
        raise RuntimeError("SERPAPI_API_KEY / SERPAPI_API_KEYS not set")

    max_attempts = len(keys)
    last_err: Exception | None = None

    async with httpx.AsyncClient(timeout=60.0) as client:
        for _ in range(max_attempts):
            key = await serpapi_pool.get_active_key()
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
                    await serpapi_pool.mark_exhausted(key, cooldown_seconds=86400, reason="monthly_limit_429")
                    continue
                r.raise_for_status()
                await serpapi_pool.record_usage(key)
                return r.json()
            except Exception as exc:
                last_err = exc
                if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 429:
                    await serpapi_pool.mark_exhausted(key, cooldown_seconds=86400, reason="monthly_limit_429")
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
                  0  = All topics (omitted from query)
    hl          : language code
    """
    keys = serpapi_pool.get_all_keys()
    if not keys:
        raise RuntimeError("SERPAPI_API_KEY / SERPAPI_API_KEYS not set")

    max_attempts = len(keys)
    last_err: Exception | None = None

    async with httpx.AsyncClient(timeout=60.0) as client:
        for _ in range(max_attempts):
            key = await serpapi_pool.get_active_key()
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
                    await serpapi_pool.mark_exhausted(key, cooldown_seconds=86400, reason="monthly_limit_429")
                    continue
                r.raise_for_status()
                await serpapi_pool.record_usage(key)
                return r.json()
            except Exception as exc:
                last_err = exc
                if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 429:
                    await serpapi_pool.mark_exhausted(key, cooldown_seconds=86400, reason="monthly_limit_429")
                    continue
                raise

    if last_err:
        raise last_err
    raise RuntimeError("All SerpApi keys exhausted")
