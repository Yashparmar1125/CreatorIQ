"""YouTube Data API collector — real rising videos as primary trend signal."""

from __future__ import annotations

import logging
import math
import re
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.integrations.youtube_data_client import YouTubeDataClient
from app.models.concept_models import ConceptLifecycle, ConceptSignalSource
from app.repositories.concept_repository import ConceptRepository
from app.services.niche_taxonomy import NICHE_CLUSTERS, ON_DEMAND_QUERIES, YOUTUBE_VIDEO_QUERIES
from app.services.quality_filters import passes_ingest_quality
from app.services.scoring import compute_raw_momentum

logger = logging.getLogger(__name__)

_ISO_DURATION = re.compile(
    r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$"
)


def _parse_iso_duration(duration: str | None) -> int:
    """Return duration in seconds."""
    if not duration:
        return 0
    m = _ISO_DURATION.match(duration)
    if not m:
        return 0
    h, mn, s = (int(x or 0) for x in m.groups())
    return h * 3600 + mn * 60 + s


def _hours_since(published_at: str | None) -> float:
    if not published_at:
        return 24.0
    try:
        dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        return max(1.0, (datetime.now(timezone.utc) - dt).total_seconds() / 3600.0)
    except ValueError:
        return 24.0


def _velocity_norm(views: int, hours: float) -> float:
    vph = views / hours
    return min(100.0, math.log10(vph + 1) * 18)


def _lifecycle_from_velocity(vph: float, views: int) -> ConceptLifecycle:
    if views >= 500_000 and vph >= 5000:
        return ConceptLifecycle.peaking
    if vph >= 2000 or views >= 100_000:
        return ConceptLifecycle.growing
    if vph >= 200 or views >= 10_000:
        return ConceptLifecycle.emerging
    return ConceptLifecycle.declining


def _format_views(n: int) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.0f}K"
    return str(n)


class YouTubeVideoCollector:
    def __init__(self) -> None:
        self.repo = ConceptRepository()
        self.client = YouTubeDataClient()

    async def collect_all_clusters(self, db: AsyncSession) -> int:
        if not settings.youtube_api_key:
            logger.warning("YOUTUBE_API_KEY not set — skipping YouTube video collection")
            return 0

        ingested = 0
        seen_videos: set[str] = set()
        for cluster_name, cfg in NICHE_CLUSTERS.items():
            try:
                n = await self._collect_cluster(
                    db,
                    cluster_name,
                    region_code=cfg.get("geo_default", "IN"),
                    queries=cfg.get("youtube_queries") or YOUTUBE_VIDEO_QUERIES.get(cluster_name, []),
                    seen_videos=seen_videos,
                )
                ingested += n
            except Exception:
                logger.exception("YouTube collector failed for %s", cluster_name)
        await db.commit()
        return ingested

    async def collect_for_niches(
        self,
        db: AsyncSession,
        niches: list[str],
        *,
        region_code: str = "IN",
        max_queries: int = 4,
    ) -> int:
        if not settings.youtube_api_key or not niches:
            return 0

        seen: set[str] = set()
        ingested = 0
        for niche in niches[:2]:
            cluster = next((k for k in NICHE_CLUSTERS if k.lower() == niche.lower()), niche)
            queries = (
                YOUTUBE_VIDEO_QUERIES.get(cluster)
                or ON_DEMAND_QUERIES.get(cluster)
                or [f"{niche.lower()} shorts"]
            )[:2]
            for q in queries[: max_queries // 2 or 1]:
                try:
                    ingested += await self._ingest_query(
                        db, cluster, q, region_code=region_code, seen_videos=seen
                    )
                except Exception:
                    logger.exception("YouTube on-demand failed: %s / %s", cluster, q)
        if ingested:
            await db.commit()
        return ingested

    async def _collect_cluster(
        self,
        db: AsyncSession,
        cluster_name: str,
        *,
        region_code: str,
        queries: list[str],
        seen_videos: set[str],
    ) -> int:
        count = 0
        for query in queries[:5]:
            count += await self._ingest_query(
                db, cluster_name, query, region_code=region_code, seen_videos=seen_videos
            )
        return count

    async def _ingest_query(
        self,
        db: AsyncSession,
        cluster_name: str,
        query: str,
        *,
        region_code: str,
        seen_videos: set[str],
    ) -> int:
        # Shorts-first for entertainment-style niches; any duration for long-form niches
        duration = "short" if cluster_name in ("Entertainment", "Gaming", "Beauty", "Fitness") else "any"
        candidates = await self.client.search_videos(
            q=query,
            region_code=region_code,
            published_after_days=settings.youtube_search_days,
            order="viewCount",
            video_duration=duration,
            max_results=settings.youtube_search_max_results,
        )
        if not candidates:
            return 0

        video_ids = [c["video_id"] for c in candidates if c["video_id"] not in seen_videos]
        stats_map = await self.client.get_video_statistics(video_ids)
        count = 0

        for cand in candidates:
            vid = cand["video_id"]
            if vid in seen_videos:
                continue
            stats = stats_map.get(vid) or {}
            views = int(stats.get("view_count") or 0)
            if views < settings.youtube_min_views:
                continue

            title = (stats.get("title") or cand["title"] or "").strip()
            if not title or not passes_ingest_quality(title, search_volume=views):
                continue

            hours = _hours_since(stats.get("published_at") or cand.get("published_at"))
            vph = views / hours
            video_vel = _velocity_norm(views, hours)
            vol_norm = min(100.0, math.log10(views + 1) * 22)
            momentum = compute_raw_momentum(
                youtube_video_velocity=video_vel,
                youtube_search_velocity=video_vel * 0.3,
                google_trends_growth=0.0,
                search_volume_norm=vol_norm,
            )
            channel = stats.get("channel_title") or cand.get("channel_title") or "Unknown"
            secs = _parse_iso_duration(stats.get("duration"))
            fmt = "shorts" if secs and secs <= 90 else "long_form"

            concept = await self.repo.upsert_concept(
                db,
                title=title,
                niche_tags=[cluster_name],
                geo_strength={region_code: 1.0},
                youtube_video_velocity=video_vel,
                youtube_search_velocity=video_vel * 0.3,
                google_trends_growth=0.0,
                search_volume_est=views,
                raw_momentum=momentum,
                lifecycle=_lifecycle_from_velocity(vph, views),
                why_trending=(
                    f"Fast-growing YouTube video in {cluster_name}: "
                    f"{_format_views(views)} views in {hours:.0f}h ({_format_views(int(vph))}/hr) by {channel}."
                ),
                key_indicator=f"{_format_views(views)} views · {_format_views(int(vph))}/hr",
                sources=["youtube_data", "youtube_video"],
                aliases=[channel, vid],
            )
            await self.repo.add_signal(
                db,
                concept_id=concept.id,
                source=ConceptSignalSource.youtube_video,
                payload={
                    "video_id": vid,
                    "channel": channel,
                    "views": views,
                    "views_per_hour": round(vph, 1),
                    "query": query,
                    "cluster": cluster_name,
                    "format": fmt,
                    "duration_sec": secs,
                    "url": f"https://www.youtube.com/watch?v={vid}",
                },
            )
            seen_videos.add(vid)
            count += 1

        return count
