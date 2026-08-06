"""Personalized Top-5 feed generation from concept store."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.concept_models import ConceptLifecycle, TrendConcept
from app.repositories.concept_repository import ConceptRepository
from app.repositories.feed_repository import FeedRepository
from app.services.concept_collector import ConceptCollector
from app.services.trend_enrichment_service import TrendEnrichmentService
from app.services.niche_taxonomy import NICHE_KEYWORDS, PLAN_CREDITS
from app.services.quality_filters import passes_feed_quality
from app.services.scoring import (
    GEO_RELEVANCE_THRESHOLD,
    NICHE_FIT_THRESHOLD,
    format_fit_score,
    geo_weighted_relevance,
    niche_fit_score,
    opportunity_score,
)

logger = logging.getLogger(__name__)

_POLITICS_KEYWORDS = {"election", "politics", "parliament", "minister", "government", "vote", "congress"}


def _volume_display(vol: int) -> str:
    if vol >= 1_000_000:
        return f"{vol / 1_000_000:.1f}M"
    if vol >= 1_000:
        return f"{vol / 1_000:.0f}K"
    return str(vol) if vol > 0 else "N/A"


def _lifecycle_archetype(lifecycle: str, score: float) -> str:
    if lifecycle == "peaking":
        return "Peaking"
    if lifecycle == "declining":
        return "The Discovery"
    if score >= 85:
        return "The Greenlight"
    if score >= 70:
        return "The Evergreen"
    return "The Discovery"


def _growth_tip(title: str, lifecycle: str, niche: str, score: float) -> str:
    if lifecycle == "peaking":
        return f"'{title}' is peaking in {niche}. Move fast with a unique angle or reaction before saturation."
    if score >= 85:
        return f"Strong opportunity in {niche}: '{title}' has high momentum with solid niche fit. Publish while competition is low."
    if lifecycle == "emerging":
        return f"Early signal for '{title}' in {niche}. Test with a Short or community post to gauge audience interest."
    return f"'{title}' is gaining traction in {niche}. A focused video with your channel's tone could capture rising search demand."


class FeedService:
    def __init__(self) -> None:
        self.concept_repo = ConceptRepository()
        self.feed_repo = FeedRepository()
        self.collector = ConceptCollector()
        self.enrichment = TrendEnrichmentService()

    async def get_creator_context(self, user_id: uuid.UUID) -> dict[str, Any]:
        defaults: dict[str, Any] = {
            "niches": ["Entertainment"],
            "content_formats": ["long_form", "shorts"],
            "tone": "mixed",
            "subscriber_count": 0,
            "channel_name": None,
            "thumbnail_url": None,
            "geo_source": "global_default",
            "audience_geo_weights": {},
            "content_format": "both",
            "plan": "free",
        }
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                headers = {"X-Internal-Service-Token": settings.internal_service_token}
                ctx_r = await client.get(
                    f"{settings.channel_service_url}/internal/channels/user/{user_id}/context",
                    headers=headers,
                )
                if ctx_r.status_code == 200:
                    ctx = ctx_r.json().get("data", {})
                    defaults["niches"] = ctx.get("niches") or defaults["niches"]
                    defaults["content_formats"] = ctx.get("content_formats") or defaults["content_formats"]
                    defaults["tone"] = ctx.get("tone") or defaults["tone"]
                    geo = ctx.get("geo") or {}
                    defaults["geo_source"] = geo.get("source") or defaults["geo_source"]
                    defaults["audience_geo_weights"] = geo.get("audience_weights") or {}
                    fmts = defaults["content_formats"]
                    if len(fmts) >= 2:
                        defaults["content_format"] = "both"
                    elif fmts:
                        defaults["content_format"] = fmts[0]

                ch_r = await client.get(
                    f"{settings.channel_service_url}/channels",
                    headers={**headers, "X-User-Id": str(user_id)},
                )
                if ch_r.status_code == 200:
                    channels = ch_r.json().get("data", {}).get("channels", [])
                    primary = next((c for c in channels if c.get("is_primary")), channels[0] if channels else None)
                    if primary:
                        defaults["subscriber_count"] = primary.get("subscriber_count", 0)
                        defaults["channel_name"] = primary.get("name")
                        defaults["thumbnail_url"] = primary.get("thumbnail_url")
        except Exception:
            logger.exception("Failed to fetch creator context for %s", user_id)
        return defaults

    def _score_concept(self, concept: TrendConcept, ctx: dict[str, Any]) -> dict[str, Any] | None:
        title = concept.canonical_title
        title_l = title.lower()
        vol = int(concept.search_volume_est or 0)

        if not passes_feed_quality(title, search_volume=vol):
            return None
        if any(kw in title_l for kw in _POLITICS_KEYWORDS):
            return None
        if concept.lifecycle == ConceptLifecycle.expired:
            return None

        user_niches = ctx["niches"]
        keywords: list[str] = []
        for n in user_niches:
            keywords.extend(NICHE_KEYWORDS.get(n.lower(), [n.lower()]))

        nfit = niche_fit_score(
            user_niches=user_niches,
            concept_niches=concept.niche_tags or [],
            title=title,
            keywords=keywords,
        )
        if nfit < NICHE_FIT_THRESHOLD:
            return None

        geo_src = ctx.get("geo_source") or "global_default"
        grelevance = geo_weighted_relevance(
            audience_weights=ctx.get("audience_geo_weights") or {},
            concept_geo=dict(concept.geo_strength or {}),
            geo_source=geo_src,
        )
        if grelevance < GEO_RELEVANCE_THRESHOLD and geo_src != "global_default":
            return None

        raw = float(concept.raw_momentum)
        fmt_fit = format_fit_score(user_format=ctx.get("content_format", "both"), supported=["long_form", "shorts"])
        opp = opportunity_score(
            raw_momentum=raw,
            niche_fit=nfit,
            geo_relevance=grelevance,
            format_fit=fmt_fit,
        )

        vol = int(concept.search_volume_est or 0)
        yt_vel = float(concept.youtube_video_velocity or 0)
        gt_growth = float(concept.google_trends_growth or 0)
        sources = list(concept.sources or [])
        is_youtube_video = "youtube_data" in sources
        aliases = list(concept.aliases or [])
        video_id: str | None = None
        channel_name: str | None = None
        if len(aliases) >= 2 and len(aliases[1]) == 11:
            channel_name = aliases[0]
            video_id = aliases[1]

        if is_youtube_video and vol > 0:
            velocity = concept.key_indicator or f"{_volume_display(vol)} views"
        else:
            increase_pct = int(max(yt_vel, gt_growth) * 10)
            velocity = f"+{increase_pct}%" if increase_pct else "rising"

        lifecycle = concept.lifecycle.value if hasattr(concept.lifecycle, "value") else str(concept.lifecycle)
        primary_niche = (concept.niche_tags or user_niches)[:1]
        niche_label = primary_niche[0] if primary_niche else user_niches[0]

        archetype = _lifecycle_archetype(lifecycle, opp)
        tip = _growth_tip(title, lifecycle, niche_label, opp)

        saturation = 75.0 if lifecycle == "peaking" else max(10.0, 80.0 - opp * 0.6)
        stability = 35.0 if lifecycle == "emerging" else min(85.0, 40.0 + opp * 0.4)

        return {
            "id": str(concept.id),
            "topic": title,
            "niches": list(concept.niche_tags or user_niches[:2]),
            "opportunity_score": round(opp, 2),
            "tvs_score": round(opp, 2),
            "niche_fit_score": round(nfit, 3),
            "geo_relevance": round(grelevance, 3),
            "raw_momentum": round(raw, 2),
            "velocity": velocity,
            "volume": _volume_display(vol),
            "search_volume": vol,
            "lifecycle": lifecycle,
            "status": lifecycle,
            "why_trending": concept.why_trending or f"Trending in {niche_label}",
            "key_indicator": concept.key_indicator or f"{_volume_display(vol)} searches",
            "archetype": archetype,
            "growth_tip": tip,
            "saturation_index": round(saturation, 1),
            "stability_score": round(stability, 1),
            "adjacent_topics": [a for a in aliases if a != video_id][:3],
            "supported_formats": ctx.get("content_formats") or ["long_form", "shorts"],
            "prediction_confidence": round(min(0.99, 0.5 + nfit * 0.3 + grelevance * 0.2), 3),
            "top_keywords": [title] + [a for a in aliases if a != video_id][:3],
            "description": concept.why_trending or tip,
            "sources": sources,
            "is_youtube_video": is_youtube_video,
            "video_url": f"https://www.youtube.com/watch?v={video_id}" if video_id else None,
            "channel_name": channel_name,
            "saved": False,
        }

    def _apply_freshness(
        self,
        ranked: list[dict[str, Any]],
        previous_ids: set[str],
        *,
        top_n: int = 5,
    ) -> list[dict[str, Any]]:
        if not previous_ids:
            return ranked[:top_n]

        fresh = [x for x in ranked if x["id"] not in previous_ids]
        repeats = [x for x in ranked if x["id"] in previous_ids]

        selected: list[dict[str, Any]] = []
        selected.extend(fresh[:top_n])

        if len(selected) < top_n:
            need = top_n - len(selected)
            selected.extend(repeats[:need])

        if len(selected) < top_n:
            seen = {x["id"] for x in selected}
            for item in ranked:
                if item["id"] not in seen:
                    selected.append(item)
                    seen.add(item["id"])
                if len(selected) >= top_n:
                    break

        return selected[:top_n]

    def _matches_user_clusters(self, concept: TrendConcept, user_niches: list[str]) -> bool:
        """Only surface concepts from clusters aligned with the creator's niches."""
        if not user_niches:
            return True
        tags = {t.lower() for t in (concept.niche_tags or [])}
        for niche in user_niches:
            n = niche.lower().strip()
            if n in tags or any(n in t or t in n for t in tags):
                return True
        return False

    async def _build_ranked_pool(self, db: AsyncSession, ctx: dict[str, Any]) -> list[dict[str, Any]]:
        concepts = await self.concept_repo.list_active_concepts(db, max_age_days=7, limit=200)
        user_niches = ctx.get("niches") or []
        scored: list[dict[str, Any]] = []
        for c in concepts:
            if not self._matches_user_clusters(c, user_niches):
                continue
            item = self._score_concept(c, ctx)
            if item:
                scored.append(item)
        scored.sort(
            key=lambda x: (
                x.get("is_youtube_video", False),
                x["opportunity_score"] + (12.0 if x.get("is_youtube_video") else 0.0),
            ),
            reverse=True,
        )
        return scored

    async def get_latest_feed(self, db: AsyncSession, user_id: uuid.UUID) -> dict[str, Any] | None:
        snap = await self.feed_repo.get_latest_snapshot(db, user_id)
        if not snap:
            return None
        ctx = await self.get_creator_context(user_id)
        return self._wrap_feed_response(snap.items, snap, ctx)

    async def get_feed_snapshot(
        self, db: AsyncSession, user_id: uuid.UUID, feed_id: uuid.UUID
    ) -> dict[str, Any]:
        snap = await self.feed_repo.get_snapshot_by_id(db, user_id, feed_id)
        if not snap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Feed snapshot not found.", "details": {}},
            )
        latest = await self.feed_repo.get_latest_snapshot(db, user_id)
        ctx = await self.get_creator_context(user_id)
        payload = self._wrap_feed_response(snap.items, snap, ctx)
        payload["is_current"] = latest is not None and latest.id == snap.id
        payload["is_historical"] = not payload["is_current"]
        return payload

    async def generate_feed(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        *,
        is_first_feed: bool = False,
        consume_credit: bool = True,
        plan: str = "free",
    ) -> dict[str, Any]:
        ctx = await self.get_creator_context(user_id)
        limit = PLAN_CREDITS.get(plan, PLAN_CREDITS["free"])

        if settings.feed_credits_enabled and consume_credit and not is_first_feed:
            used = await self.feed_repo.count_refreshes_this_month(db, user_id)
            if used >= limit:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "code": "CREDITS_EXHAUSTED",
                        "message": f"Monthly refresh limit reached ({limit}). Upgrade for more refreshes.",
                        "details": {"used": used, "limit": limit},
                    },
                )

        ranked = await self._build_ranked_pool(db, ctx)
        if len(ranked) < 5:
            geo = "IN"
            weights = ctx.get("audience_geo_weights") or {}
            if weights:
                geo = max(weights, key=weights.get)
            await self.collector.collect_for_niches(db, ctx.get("niches") or [], geo=geo)
            ranked = await self._build_ranked_pool(db, ctx)

        if not ranked:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "NO_CONCEPTS",
                    "message": "Trend data is still being collected. Try again shortly.",
                    "details": {},
                },
            )

        prev = await self.feed_repo.get_latest_snapshot(db, user_id)
        prev_ids = set(prev.concept_ids) if prev else set()
        top5 = self._apply_freshness(ranked, prev_ids, top_n=5)

        if settings.enable_trend_enrichment and settings.openrouter_api_key:
            top5 = await self.enrichment.enrich_feed_items(top5, ctx, ranked_backup=ranked)

        credits_used = 0 if is_first_feed else (1 if consume_credit else 0)
        snap = await self.feed_repo.save_snapshot(
            db,
            user_id=user_id,
            items=top5,
            concept_ids=[x["id"] for x in top5],
            credits_used=credits_used,
            is_first_feed=is_first_feed,
            geo_source=ctx.get("geo_source"),
        )
        if credits_used:
            await self.feed_repo.increment_credits(db, user_id, credits_used)

        await db.commit()
        return self._wrap_feed_response(top5, snap, ctx, plan=plan)

    def _wrap_feed_response(
        self,
        items: list[dict],
        snap: Any,
        ctx: dict[str, Any],
        *,
        plan: str = "free",
    ) -> dict[str, Any]:
        geo_source = ctx.get("geo_source") or snap.geo_source or "global_default"
        geo_badge = None
        if geo_source in ("onboarding_country", "global_default"):
            geo_badge = "Using estimated geography — analytics will improve recommendations."

        limit = PLAN_CREDITS.get(plan, 2)
        credits: dict[str, Any] = {"plan": plan}
        if settings.feed_credits_enabled:
            credits["limit"] = limit
        else:
            credits["limit"] = None
            credits["unlimited"] = True
        ai_enriched = any(x.get("ai_enriched") for x in items)
        return {
            "trends": items,
            "feed_id": str(snap.id),
            "snapshot_at": snap.created_at.isoformat() if snap.created_at else datetime.now(timezone.utc).isoformat(),
            "personalized": True,
            "ai_enriched": ai_enriched,
            "channel": {
                "name": ctx.get("channel_name"),
                "thumbnail_url": ctx.get("thumbnail_url"),
                "niches": ctx.get("niches"),
                "tone": ctx.get("tone"),
                "subscriber_count": ctx.get("subscriber_count", 0),
            },
            "geo": {
                "source": geo_source,
                "badge": geo_badge,
                "audience_weights": ctx.get("audience_geo_weights") or {},
            },
            "credits": credits,
        }

    async def list_history(self, db: AsyncSession, user_id: uuid.UUID, *, limit: int = 10) -> dict[str, Any]:
        snaps = await self.feed_repo.list_history(db, user_id, limit=limit)
        latest_id = snaps[0].id if snaps else None
        return {
            "feeds": [
                {
                    "feed_id": str(s.id),
                    "created_at": s.created_at.isoformat(),
                    "item_count": len(s.items or []),
                    "is_first_feed": s.is_first_feed,
                    "credits_used": s.credits_used,
                    "topics": [x.get("topic") for x in (s.items or [])[:5]],
                    "preview_topics": [x.get("topic") for x in (s.items or [])[:3]],
                    "is_current": s.id == latest_id,
                }
                for s in snaps
            ]
        }

    async def search_concepts(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        query: str,
        *,
        limit: int = 5,
    ) -> dict[str, Any]:
        ctx = await self.get_creator_context(user_id)
        concepts = await self.concept_repo.search_by_title(db, query, limit=30)
        scored: list[dict[str, Any]] = []
        for c in concepts:
            item = self._score_concept(c, ctx)
            if item:
                scored.append(item)
        scored.sort(key=lambda x: x["opportunity_score"], reverse=True)
        trends = scored[:limit]
        if settings.enable_trend_enrichment and settings.openrouter_api_key and trends:
            trends = await self.enrichment.enrich_feed_items(trends, ctx)
        return {
            "trends": trends,
            "personalized": False,
            "channel": {
                "name": ctx.get("channel_name"),
                "thumbnail_url": ctx.get("thumbnail_url"),
                "niches": ctx.get("niches"),
                "tone": ctx.get("tone"),
                "subscriber_count": ctx.get("subscriber_count", 0),
            },
            "geo": {"source": ctx.get("geo_source"), "badge": None},
        }
