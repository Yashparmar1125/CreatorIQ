"""
SerpApi Google Trends clients
  - search_google_trends()       → engine: google_trends (RELATED_QUERIES etc.)
  - search_trending_now()        → engine: google_trends_trending_now  ← primary
"""

from typing import Any

import httpx

from app.core.config import settings


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
    if not settings.serpapi_api_key:
        raise RuntimeError("SERPAPI_API_KEY not set")

    params: dict[str, Any] = {
        "engine": "google_trends",
        "api_key": settings.serpapi_api_key,
        "q": q,
        "data_type": data_type,
        "hl": hl,
        "date": date,
    }
    if geo:
        params["geo"] = geo
    if gprop:
        params["gprop"] = gprop

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.get(settings.serpapi_base_url, params=params)
        r.raise_for_status()
        return r.json()


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

    Response shape (simplified):
    {
      "trending_searches": [
        {
          "query":           "string",          ← trending topic
          "search_volume":   500000,            ← approximate volume
          "trend_breakdown": [                  ← hourly time-series
            {"period": "...", "value": int},
            ...
          ],
          "related_queries": ["...", "..."],    ← adjacents
          "articles": [                         ← news context
            {"title": "...", "source": "...", "snippet": "..."},
            ...
          ]
        }
      ]
    }
    """
    if not settings.serpapi_api_key:
        raise RuntimeError("SERPAPI_API_KEY not set")

    params: dict[str, Any] = {
        "engine":      "google_trends_trending_now",
        "api_key":     settings.serpapi_api_key,
        "geo":         geo,
        "hours":       hours,
        "category_id": category_id,
        "hl":          hl,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.get(settings.serpapi_base_url, params=params)
        r.raise_for_status()
        return r.json()
