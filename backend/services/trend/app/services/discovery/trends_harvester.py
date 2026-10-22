"""
Google Trends & SerpApi Rising Harvester — zero YouTube quota.
Captures breakout search terms and rising YouTube search queries.
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings
from app.integrations.serpapi_client import search_google_trends, search_trending_now, serpapi_pool

logger = logging.getLogger(__name__)

SEED_SEARCH_QUERIES: dict[str, list[str]] = {
    "Tech": ["ai tools", "coding assistant", "machine learning", "software engineer"],
    "Fitness": ["workout routine", "protein diet", "gym exercises", "weight loss"],
    "Gaming": ["gaming meta", "gameplay walkthrough", "esports tournament"],
    "Education": ["study techniques", "productivity hacks", "career growth"],
    "Finance": ["stock market investing", "budgeting savings", "passive income"],
    "Lifestyle": ["meal prep", "morning routine", "travel vlog"],
}


class GoogleTrendsHarvester:
    """Harvests rising breakout search queries on YouTube search via Google Trends API."""

    def __init__(self) -> None:
        pass

    async def fetch_rising_trends(
        self,
        *,
        categories: list[str] | None = None,
        geo: str = "IN",
    ) -> list[dict[str, Any]]:
        if not serpapi_pool.get_keys() or not settings.enable_serpapi_collector:
            logger.info("SerpApi collector disabled or API key missing.")
            return []

        results: list[dict[str, Any]] = []
        target_niches = categories or list(SEED_SEARCH_QUERIES.keys())

        # 1. RELATED_QUERIES with gprop="youtube"
        for niche in target_niches:
            queries = SEED_SEARCH_QUERIES.get(niche, [])[:2]
            for query in queries:
                try:
                    raw = await search_google_trends(
                        q=query,
                        geo=geo,
                        gprop="youtube",
                        data_type="RELATED_QUERIES",
                    )
                    rising = raw.get("related_queries", {}).get("rising", []) or []
                    for item in rising[:6]:
                        if not isinstance(item, dict):
                            continue
                        q_text = (item.get("query") or "").strip()
                        if not q_text or len(q_text) < 3:
                            continue
                        raw_val = str(item.get("value") or "").replace("+", "").replace("%", "")
                        growth_pct = 500 if "breakout" in raw_val.lower() else (int(float(raw_val)) if raw_val.replace(".", "", 1).isdigit() else 100)
                        results.append(
                            {
                                "title": q_text,
                                "category": niche,
                                "source_query": query,
                                "growth_pct": growth_pct,
                                "extracted_value": item.get("extracted_value"),
                                "source": "google_trends_rising",
                            }
                        )
                except Exception as exc:
                    logger.debug("Google Trends rising search failed for %s / %s: %s", niche, query, exc)

        # 2. Trending Now (24h breakout searches)
        try:
            raw_trending = await search_trending_now(geo=geo, hours="24", category_id="0")
            for ts in (raw_trending.get("trending_searches") or [])[:10]:
                if not isinstance(ts, dict):
                    continue
                q_text = (ts.get("query") or "").strip()
                if not q_text:
                    continue
                pct = int(ts.get("increase_percentage") or 100)
                vol = int(ts.get("search_volume") or 0)
                cats = [c.get("name") for c in (ts.get("categories") or []) if isinstance(c, dict) and c.get("name")]
                cat = cats[0] if cats else "General"
                results.append(
                    {
                        "title": q_text,
                        "category": cat,
                        "source_query": "trending_now",
                        "growth_pct": pct,
                        "search_volume": vol,
                        "breakdown": ts.get("trend_breakdown") or [],
                        "source": "google_trends_now",
                    }
                )
        except Exception as exc:
            logger.debug("Google Trends trending_now failed: %s", exc)

        logger.info("Harvested %d rising signals from Google Trends.", len(results))
        return results
