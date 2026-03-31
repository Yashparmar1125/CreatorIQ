"""SerpApi Google Trends client — https://serpapi.com/google-trends-api"""

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
    if not settings.serpapi_api_key:
        raise RuntimeError("SERPAPI_API_KEY / serpapi_api_key is not set")

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
