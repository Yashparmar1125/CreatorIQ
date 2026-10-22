"""
Tavily Web Search Harvester — zero YouTube quota.
Searches creator forums, newsletters, and Reddit discussions for breakout trends.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.core.key_pool import tavily_pool

logger = logging.getLogger(__name__)

TAVILY_SEARCH_URL = "https://api.tavily.com/search"


class TavilyTrendHarvester:
    """Harvests discussions and emerging creator topics via Tavily Web Search API with Redis key pool."""

    def __init__(self) -> None:
        pass

    async def search_emerging_topics(
        self,
        *,
        niches: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        all_keys = tavily_pool.get_all_keys()
        if not all_keys:
            logger.info("No Tavily API keys configured, skipping Tavily harvest.")
            return []

        target_niches = niches or ["Tech", "Fitness", "Gaming", "Finance", "News & Current Affairs"]
        signals: list[dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=12.0) as client:
            for niche in target_niches:
                if niche == "News & Current Affairs":
                    query = "trending breaking news controversy India debates viral current affairs 2026"
                else:
                    query = f"trending YouTube video topics and breakout ideas {niche} 2026"
                max_attempts = len(all_keys)
                for _ in range(max_attempts):
                    key = await tavily_pool.get_active_key()
                    if not key:
                        break
                    try:
                        resp = await client.post(
                            TAVILY_SEARCH_URL,
                            json={
                                "api_key": key,
                                "query": query,
                                "search_depth": "basic",
                                "include_answer": False,
                                "max_results": 5,
                            },
                        )
                        if resp.status_code == 200:
                            await tavily_pool.record_usage(key)
                            data = resp.json()
                            results = data.get("results") or []
                            for r in results:
                                signals.append(
                                    {
                                        "title": r.get("title") or "",
                                        "snippet": (r.get("content") or "")[:350],
                                        "url": r.get("url"),
                                        "category": niche,
                                        "source": "tavily_web_search",
                                    }
                                )
                            break
                        elif resp.status_code == 429:
                            await tavily_pool.mark_exhausted(key, cooldown_seconds=86400, reason="quota_exceeded")
                            continue
                        else:
                            logger.debug("Tavily search failed for %s with key ...%s: HTTP %s", niche, key[-6:], resp.status_code)
                            break
                    except Exception as exc:
                        logger.debug("Tavily search error for %s: %s", niche, exc)
                        break

        logger.info("Harvested %d topic signals from Tavily Web Search.", len(signals))
        return signals
