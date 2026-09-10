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
from app.services.vector_service import VectorService
from app.services.niche_taxonomy import NICHE_KEYWORDS, PLAN_CREDITS
from app.services.quality_filters import passes_feed_quality, passes_ingest_quality
from app.services.scoring import (
    GEO_RELEVANCE_THRESHOLD,
    NICHE_FIT_THRESHOLD,
    classify_creator_tier,
    detect_momentum_outliers,
    format_fit_score,
    geo_weighted_relevance,
    niche_fit_score,
    opportunity_score,
)

logger = logging.getLogger(__name__)

_POLITICS_KEYWORDS = {"election", "politics", "parliament", "minister", "government", "vote", "congress"}
_RELAXED_NICHE_FIT_THRESHOLD = 0.42
_FEED_TARGET = 15


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
        self.vector_service = VectorService()

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

    def _score_concept(
        self,
        concept: TrendConcept,
        ctx: dict[str, Any],
        *,
        strict: bool = True,
        all_volumes: list[int] | None = None,
    ) -> dict[str, Any] | None:
        title = concept.canonical_title
        title_l = title.lower()
        vol = int(concept.search_volume_est or 0)

        if strict:
            if not passes_feed_quality(title, search_volume=vol):
                return None
        elif not passes_ingest_quality(title, search_volume=vol):
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
        niche_threshold = NICHE_FIT_THRESHOLD if strict else _RELAXED_NICHE_FIT_THRESHOLD
        if nfit < niche_threshold:
            return None

        geo_src = ctx.get("geo_source") or "global_default"
        grelevance = geo_weighted_relevance(
            audience_weights=ctx.get("audience_geo_weights") or {},
            concept_geo=dict(concept.geo_strength or {}),
            geo_source=geo_src,
        )
        if strict and grelevance < GEO_RELEVANCE_THRESHOLD and geo_src != "global_default":
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
            "creator_tier": classify_creator_tier(vol, all_volumes or []),
            "saved": False,
        }

    def _apply_freshness(
        self,
        ranked: list[dict[str, Any]],
        previous_ids: set[str],
        *,
        top_n: int = 15,
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

        result = selected[:top_n]
        # Soft diversity: ensure top-5 isn't exclusively big creators if smaller creators exist
        if len(result) >= 5 and all(x.get("creator_tier") == "big" for x in result[:5]):
            alt = next((x for x in ranked if x.get("creator_tier") in ("small", "medium") and x["id"] not in {r["id"] for r in result[:4]}), None)
            if alt is not None:
                result[4] = alt

        return result

    def _matches_user_clusters(self, concept: TrendConcept, user_niches: list[str]) -> bool:
        """Surface concepts aligned with creator niches by tag or title keyword match."""
        if not user_niches:
            return True
        tags = {t.lower() for t in (concept.niche_tags or [])}
        title_l = (concept.canonical_title or "").lower()
        for niche in user_niches:
            n = niche.lower().strip()
            if n in tags or any(n in t or t in n for t in tags) or n in title_l:
                return True
        return False

    async def _build_ranked_pool(
        self,
        db: AsyncSession,
        ctx: dict[str, Any],
        *,
        strict: bool = True,
    ) -> list[dict[str, Any]]:
        concepts = await self.concept_repo.list_active_concepts(db, max_age_days=7, limit=200)
        user_niches = ctx.get("niches") or []

        # Outlier detection (μ + 2σ) across active pool
        outlier_ids = detect_momentum_outliers(concepts)
        all_volumes = [int(c.search_volume_est or 0) for c in concepts]

        # Vector semantic similarity search for creator context
        vector_hits = {}
        if settings.enable_vector_search and user_niches:
            try:
                query_str = " ".join(user_niches) + " " + ctx.get("tone", "")
                hits = self.vector_service.search_similar(query_str, niche_tags=user_niches, limit=50)
                for h in hits:
                    vector_hits[h["concept_id"]] = h["score"]
            except Exception as e:
                logger.warning(f"Vector similarity query skipped: {e}")

        scored: list[dict[str, Any]] = []
        for c in concepts:
            cid = str(c.id)
            is_vector_match = cid in vector_hits
            if not is_vector_match and not self._matches_user_clusters(c, user_niches) and strict:
                continue
            item = self._score_concept(c, ctx, strict=strict, all_volumes=all_volumes)
            if item:
                is_outlier = cid in outlier_ids
                item["is_momentum_outlier"] = is_outlier
                if is_outlier:
                    item["opportunity_score"] = min(100.0, round(item["opportunity_score"] + 8.0, 2))

                if is_vector_match:
                    v_boost = vector_hits[cid] * 15.0
                    item["opportunity_score"] = min(100.0, round(item["opportunity_score"] + v_boost, 2))
                    item["vector_similarity"] = round(vector_hits[cid], 3)
                scored.append(item)

        scored.sort(
            key=lambda x: (
                x.get("is_youtube_video", False),
                x["opportunity_score"] + (12.0 if x.get("is_youtube_video") else 0.0),
            ),
            reverse=True,
        )
        return scored

    def _merge_ranked(
        self,
        primary: list[dict[str, Any]],
        secondary: list[dict[str, Any]],
        *,
        top_n: int = _FEED_TARGET,
    ) -> list[dict[str, Any]]:
        seen = {x["id"] for x in primary}
        merged = list(primary)
        for item in secondary:
            if item["id"] in seen:
                continue
            merged.append(item)
            seen.add(item["id"])
            if len(merged) >= top_n:
                break
        return merged[:top_n]

    def _resolve_geo(self, ctx: dict[str, Any]) -> str:
        weights = ctx.get("audience_geo_weights") or {}
        if weights:
            return max(weights, key=weights.get)
        return "IN"

    async def _ensure_ranked_pool(
        self,
        db: AsyncSession,
        ctx: dict[str, Any],
        *,
        is_first_feed: bool = False,
    ) -> list[dict[str, Any]]:
        """Collect concepts and score until we have enough feed candidates."""
        geo = self._resolve_geo(ctx)
        niches = ctx.get("niches") or []

        if is_first_feed:
            try:
                await self.collector.run_all_clusters(db)
            except Exception:
                logger.exception("Full collector bootstrap failed on first feed")

        ranked = await self._build_ranked_pool(db, ctx)
        if len(ranked) >= _FEED_TARGET:
            return ranked

        try:
            await self.collector.collect_for_niches(
                db,
                niches,
                geo=geo,
                max_queries=8 if is_first_feed else 4,
            )
        except Exception:
            logger.exception("On-demand niche collection failed")

        ranked = await self._build_ranked_pool(db, ctx)
        if len(ranked) >= _FEED_TARGET:
            return ranked

        if not is_first_feed:
            try:
                await self.collector.run_all_clusters(db)
            except Exception:
                logger.exception("Full collector fallback failed")
            ranked = await self._build_ranked_pool(db, ctx)

        if len(ranked) < _FEED_TARGET:
            relaxed = await self._build_ranked_pool(db, ctx, strict=False)
            ranked = self._merge_ranked(ranked, relaxed)

        return ranked

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

        # Refresh credits disabled — unlimited refreshes permitted
        if settings.feed_credits_enabled and consume_credit and not is_first_feed:
            used = await self.feed_repo.count_refreshes_this_month(db, user_id)
            if limit is not None and limit < 999999 and used >= limit:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "code": "CREDITS_EXHAUSTED",
                        "message": f"Monthly refresh limit reached ({limit}). Upgrade for more refreshes.",
                        "details": {"used": used, "limit": limit},
                    },
                )

        ranked = await self._ensure_ranked_pool(db, ctx, is_first_feed=is_first_feed)

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
        top15 = self._apply_freshness(ranked, prev_ids, top_n=15)

        if settings.enable_trend_enrichment and settings.openrouter_api_key:
            top15 = await self.enrichment.enrich_feed_items(top15, ctx, ranked_backup=ranked)

        credits_used = 0 if is_first_feed else (1 if consume_credit else 0)
        snap = await self.feed_repo.save_snapshot(
            db,
            user_id=user_id,
            items=top15,
            concept_ids=[x["id"] for x in top15],
            credits_used=credits_used,
            is_first_feed=is_first_feed,
            geo_source=ctx.get("geo_source"),
        )
        if credits_used:
            await self.feed_repo.increment_credits(db, user_id, credits_used)

        await db.commit()
        return self._wrap_feed_response(top15, snap, ctx, plan=plan)

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

        credits: dict[str, Any] = {
            "plan": plan,
            "limit": None,
            "unlimited": True,
        }
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
