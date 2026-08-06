"""Background collectors — SerpApi YouTube trends + search velocity."""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.integrations.serpapi_client import search_google_trends, search_trending_now
from app.models.concept_models import ConceptLifecycle, ConceptSignalSource
from app.repositories.concept_repository import ConceptRepository
from app.services.youtube_video_collector import YouTubeVideoCollector
from app.services.niche_taxonomy import NICHE_CLUSTERS, NICHE_KEYWORDS, ON_DEMAND_QUERIES
from app.services.quality_filters import passes_ingest_quality
from app.services.scoring import compute_raw_momentum

logger = logging.getLogger(__name__)


def _volume_norm(volume: int) -> float:
    if volume <= 0:
        return 0.0
    import math

    return min(100.0, math.log10(volume + 1) * 25)


def _parse_rising_value(raw: str | int | float | None) -> int:
    if raw is None:
        return 0
    s = str(raw).strip().replace("+", "").replace("%", "")
    if not s or not s.replace(".", "", 1).isdigit():
        return 500 if "breakout" in s.lower() else 100
    return int(float(s))


def _growth_norm(pct: int) -> float:
    return min(100.0, max(0.0, pct / 10.0))


def _lifecycle_from_growth(pct: int) -> ConceptLifecycle:
    if pct >= 500:
        return ConceptLifecycle.peaking
    if pct >= 100:
        return ConceptLifecycle.growing
    if pct >= 30:
        return ConceptLifecycle.emerging
    return ConceptLifecycle.declining


class ConceptCollector:
    def __init__(self) -> None:
        self.repo = ConceptRepository()
        self.youtube = YouTubeVideoCollector()

    async def run_all_clusters(self, db: AsyncSession) -> int:
        ingested = 0
        if settings.enable_youtube_collector and settings.youtube_api_key:
            try:
                n = await self.youtube.collect_all_clusters(db)
                ingested += n
                logger.info("YouTube video collection: %s concepts", n)
            except Exception:
                logger.exception("YouTube video collection failed")

        if not settings.serpapi_api_key:
            if ingested:
                return ingested
            logger.warning("SERPAPI_API_KEY not set — skipping SerpApi collection")
            return ingested

        if not settings.enable_serpapi_collector:
            return ingested

        for cluster_name, cfg in NICHE_CLUSTERS.items():
            try:
                n = await self._collect_cluster(db, cluster_name, cfg)
                ingested += n
            except Exception:
                logger.exception("Collector failed for cluster %s", cluster_name)
        await db.commit()
        return ingested

    async def collect_for_niches(
        self,
        db: AsyncSession,
        niches: list[str],
        *,
        geo: str = "IN",
        max_queries: int = 4,
    ) -> int:
        ingested = 0
        if settings.enable_youtube_collector and settings.youtube_api_key and niches:
            try:
                n = await self.youtube.collect_for_niches(db, niches, region_code=geo, max_queries=max_queries)
                ingested += n
            except Exception:
                logger.exception("YouTube on-demand collection failed")

        if not settings.serpapi_api_key or not niches:
            return ingested

        queries: list[tuple[str, str]] = []
        for niche in niches[:2]:
            cluster = next((k for k in NICHE_CLUSTERS if k.lower() == niche.lower()), niche)
            for q in ON_DEMAND_QUERIES.get(cluster, ON_DEMAND_QUERIES.get(niche, [f"{niche.lower()} trends"]))[:2]:
                queries.append((cluster, q))

        serp_ingested = 0
        for cluster_name, query in queries[:max_queries]:
            try:
                n = await self._collect_query(db, cluster_name, query, geo=geo)
                serp_ingested += n
            except Exception:
                logger.exception("On-demand collect failed: %s / %s", cluster_name, query)
        if serp_ingested:
            await db.commit()
        return ingested + serp_ingested

    async def _collect_query(self, db: AsyncSession, cluster_name: str, query: str, *, geo: str) -> int:
        count = 0
        try:
            raw = await search_google_trends(q=query, geo=geo, gprop="youtube", data_type="RELATED_QUERIES")
        except Exception:
            logger.exception("RELATED_QUERIES failed for %s / %s", cluster_name, query)
            return 0
        rising = raw.get("related_queries", {}).get("rising", []) or []
        for item in rising[:10]:
            if not isinstance(item, dict):
                continue
            title = (item.get("query") or "").strip()
            if not title:
                continue
            value = _parse_rising_value(item.get("value"))
            growth = _growth_norm(value)
            vol = int(item.get("extracted_value") or value * 100 or 1000)
            if not passes_ingest_quality(title, search_volume=vol):
                continue
            momentum = compute_raw_momentum(
                youtube_video_velocity=growth * 0.6,
                youtube_search_velocity=growth,
                google_trends_growth=growth,
                search_volume_norm=_volume_norm(vol),
            )
            concept = await self.repo.upsert_concept(
                db,
                title=title,
                niche_tags=[cluster_name],
                geo_strength={geo: 1.0},
                youtube_video_velocity=growth * 0.6,
                youtube_search_velocity=growth,
                google_trends_growth=growth,
                search_volume_est=vol,
                raw_momentum=momentum,
                lifecycle=_lifecycle_from_growth(value),
                why_trending=f"Rising YouTube search for '{query}' in {cluster_name}",
                key_indicator=f"+{value}% search growth",
                sources=["google_trends", "youtube_search"],
            )
            await self.repo.add_signal(
                db,
                concept_id=concept.id,
                source=ConceptSignalSource.youtube_search,
                payload={"cluster": cluster_name, "query": query, "on_demand": True},
            )
            count += 1
        return count

    async def _collect_cluster(self, db: AsyncSession, cluster_name: str, cfg: dict) -> int:
        geo = cfg.get("geo_default", "IN")
        category_id = cfg.get("category_id", "0")
        count = 0

        # YouTube search velocity via RELATED_QUERIES
        for query in cfg.get("queries", [])[:2]:
            try:
                raw = await search_google_trends(q=query, geo=geo, gprop="youtube", data_type="RELATED_QUERIES")
                rising = raw.get("related_queries", {}).get("rising", []) or []
                for item in rising[:8]:
                    if not isinstance(item, dict):
                        continue
                    title = (item.get("query") or "").strip()
                    if not title:
                        continue
                    value = _parse_rising_value(item.get("value"))
                    growth = _growth_norm(value)
                    vol = int(item.get("extracted_value") or value * 100 or 1000)
                    if not passes_ingest_quality(title, search_volume=vol):
                        continue
                    momentum = compute_raw_momentum(
                        youtube_video_velocity=growth * 0.6,
                        youtube_search_velocity=growth,
                        google_trends_growth=growth,
                        search_volume_norm=_volume_norm(vol),
                    )
                    concept = await self.repo.upsert_concept(
                        db,
                        title=title,
                        niche_tags=[cluster_name],
                        geo_strength={geo: 1.0},
                        youtube_video_velocity=growth * 0.6,
                        youtube_search_velocity=growth,
                        google_trends_growth=growth,
                        search_volume_est=vol,
                        raw_momentum=momentum,
                        lifecycle=_lifecycle_from_growth(value),
                        why_trending=f"Rising YouTube search interest in {cluster_name} (+{value}%)",
                        key_indicator=f"+{value}% search growth",
                        sources=["google_trends", "youtube_search"],
                    )
                    await self.repo.add_signal(
                        db,
                        concept_id=concept.id,
                        source=ConceptSignalSource.youtube_search,
                        payload={"cluster": cluster_name, "query": query, "rising_value": value},
                    )
                    count += 1
            except Exception:
                logger.exception("RELATED_QUERIES failed for %s / %s", cluster_name, query)

        # Trending now corroboration (optional — RELATED_QUERIES is primary)
        trending: dict = {}
        try:
            trending = await search_trending_now(geo=geo, hours="24", category_id=category_id)
        except Exception:
            try:
                if category_id != "0":
                    trending = await search_trending_now(geo=geo, hours="24", category_id="0")
            except Exception:
                logger.warning("trending_now unavailable for %s (geo=%s)", cluster_name, geo)
                trending = {}

        try:
            for ts in (trending.get("trending_searches") or [])[:10]:
                if not isinstance(ts, dict):
                    continue
                title = (ts.get("query") or "").strip()
                if not title:
                    continue
                vol = int(ts.get("search_volume") or 0)
                if not passes_ingest_quality(title, search_volume=vol):
                    continue
                pct = int(ts.get("increase_percentage") or 0)
                growth = _growth_norm(pct)
                # Category-scoped trending is already niche-filtered by SerpApi.
                # Only apply keyword gate for broad "all topics" (category_id 0).
                if category_id == "0":
                    keywords = NICHE_KEYWORDS.get(cluster_name.lower(), [cluster_name.lower()])
                    text = title.lower()
                    if not any(kw in text for kw in keywords) and cluster_name.lower() not in text:
                        continue
                momentum = compute_raw_momentum(
                    youtube_video_velocity=growth,
                    youtube_search_velocity=growth * 0.8,
                    google_trends_growth=growth,
                    search_volume_norm=_volume_norm(vol),
                    news_boost=5.0 if ts.get("active") else 0.0,
                )
                related = [t for t in (ts.get("trend_breakdown") or []) if isinstance(t, str)][:5]
                concept = await self.repo.upsert_concept(
                    db,
                    title=title,
                    niche_tags=[cluster_name],
                    geo_strength={geo: 1.0},
                    youtube_video_velocity=growth,
                    youtube_search_velocity=growth * 0.8,
                    google_trends_growth=growth,
                    search_volume_est=vol,
                    raw_momentum=momentum,
                    lifecycle=_lifecycle_from_growth(pct),
                    why_trending=f"Trending on YouTube in {geo} with {vol:,} searches",
                    key_indicator=f"+{pct}% velocity" if pct else f"{vol:,} searches",
                    sources=["google_trends", "youtube_video"],
                    aliases=related,
                )
                await self.repo.add_signal(
                    db,
                    concept_id=concept.id,
                    source=ConceptSignalSource.google_trends,
                    payload={"geo": geo, "search_volume": vol, "increase_pct": pct},
                )
                count += 1
        except Exception:
            logger.exception("trending_now failed for %s", cluster_name)

        return count
