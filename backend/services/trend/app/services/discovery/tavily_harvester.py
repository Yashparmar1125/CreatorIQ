"""
Tavily Web Search Harvester — zero YouTube quota.
Searches creator forums, newsletters, and Reddit discussions for breakout trends.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

TAVILY_SEARCH_URL = "https://api.tavily.com/search"


class TavilyTrendHarvester:
    """Harvests discussions and emerging creator topics via Tavily Web Search API."""

    def __init__(self) -> None:
        self.keys = [
            k.strip() for k in (settings.tavily_api_keys or settings.tavily_api_key).split(",") if k.strip()
        ]
        self._key_idx = 0

    def _get_key(self) -> str | None:
        if not self.keys:
            return None
        k = self.keys[self._key_idx % len(self.keys)]
        self._key_idx += 1
        return k

    async def search_emerging_topics(
        self,
        *,
        niches: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        if not self.keys:
            logger.info("No Tavily API keys configured, skipping Tavily harvest.")
            return []

        target_niches = niches or ["Tech", "Fitness", "Gaming", "Finance"]
        signals: list[dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=12.0) as client:
            for niche in target_niches:
                key = self._get_key()
                if not key:
                    break
                query = f"trending YouTube video topics and breakout ideas {niche} 2026"
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
                    else:
                        logger.debug("Tavily search failed for %s: HTTP %s", niche, resp.status_code)
                except Exception as exc:
                    logger.debug("Tavily search error for %s: %s", niche, exc)

        logger.info("Harvested %d topic signals from Tavily Web Search.", len(signals))
        return signals
