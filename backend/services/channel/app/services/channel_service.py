import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.channel_models import ChannelHistoricalSnapshot
from app.models.creator_profile_models import GeoSource, NicheSource, ProfileMode, SyncStatus
from app.repositories.channel_repository import ChannelRepository
from app.repositories.creator_profile_repository import CreatorProfileRepository
from app.services.creator_context_pipeline import (
    CreatorContextPipeline,
    _content_format_enums,
    classify_maturity,
    map_content_format,
    maturity_confidence,
)


class ChannelService:
    def __init__(self) -> None:
        self.repo = ChannelRepository()
        self.profile_repo = CreatorProfileRepository()
        self.pipeline = CreatorContextPipeline()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    async def list_channels(self, db: AsyncSession, user_id: uuid.UUID) -> dict:
        channels = await self.repo.list_channels_for_user(db, user_id)
        return {
            "data": {
                "channels": [
                    {
                        "id": str(c.id),
                        "youtube_channel_id": c.youtube_channel_id,
                        "name": c.name,
                        "handle": c.handle,
                        "thumbnail_url": c.thumbnail_url,
                        "subscriber_count": int(c.subscriber_count),
                        "video_count": int(c.video_count),
                        "view_count": int(c.view_count),
                        "engagement_rate": float(c.engagement_rate) if c.engagement_rate is not None else None,
                        "median_reach_ratio": float(c.median_reach_ratio) if getattr(c, "median_reach_ratio", None) is not None else None,
                        "dominant_traffic_source": getattr(c, "dominant_traffic_source", "browse") or "browse",
                        "speech_tempo_wpm": int(getattr(c, "speech_tempo_wpm", 155) or 155),
                        "median_retention_30s_pct": float(c.median_retention_30s_pct) if getattr(c, "median_retention_30s_pct", None) is not None else None,
                        "niches": c.niches,
                        "is_primary": c.is_primary,
                        "is_oauth_connected": bool(c.youtube_channel_id and not c.youtube_channel_id.startswith("manual-")),
                    }
                    for c in channels
                ]
            },
            "meta": {"request_id": "local-dev"},
        }

    async def channel_metrics(self, db: AsyncSession, user_id: uuid.UUID, channel_id: uuid.UUID) -> dict:
        channel = await self.repo.get_channel_for_user(db, user_id, channel_id)
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Channel not found.", "details": {}},
            )
        m = await self.repo.latest_metrics(db, channel_id)
        return {
            "data": {
                "channel_id": str(channel_id),
                "latest": (
                    None
                    if not m
                    else {
                        "recorded_at": m.recorded_at.isoformat(),
                        "period": m.period.value,
                        "views": int(m.views),
                        "watch_time_minutes": int(m.watch_time_minutes),
                        "subscribers_gained": int(m.subscribers_gained),
                        "subscribers_lost": int(m.subscribers_lost),
                        "estimated_revenue_usd": (float(m.estimated_revenue_usd) if m.estimated_revenue_usd is not None else None),
                    }
                ),
            },
            "meta": {"request_id": "local-dev"},
        }

    async def upsert_from_oauth(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        youtube_channel_id: str | None,
        name: str | None,
        handle: str | None,
        thumbnail_url: str | None,
        subscriber_count: int | None,
        video_count: int | None,
        view_count: int | None,
        engagement_rate: float | None,
        niches: list[str],
    ) -> dict:
        if not youtube_channel_id:
            channel = await self.repo.patch_channel_analysis(
                db, user_id, engagement_rate=engagement_rate, niches=niches
            )
            if not channel:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={"code": "NOT_FOUND", "message": "No channel to update.", "details": {}},
                )
            await db.commit()
            return {
                "data": {"id": str(channel.id), "youtube_channel_id": channel.youtube_channel_id, "updated": True},
                "meta": {"request_id": "local-dev"},
            }

        channel = await self.repo.upsert_channel_from_oauth(
            db,
            user_id=user_id,
            youtube_channel_id=youtube_channel_id,
            name=name or "Unknown Channel",
            handle=handle,
            thumbnail_url=thumbnail_url,
            subscriber_count=subscriber_count or 0,
            video_count=video_count or 0,
            view_count=view_count or 0,
            engagement_rate=engagement_rate,
            niches=niches,
        )

        # Immediately synchronize CreatorProfile with real OAuth channel stats (overwriting manual onboarding values)
        profile = await self.profile_repo.get_by_user_id(db, user_id)
        maturity = classify_maturity(
            video_count=int(channel.video_count),
            subscriber_count=int(channel.subscriber_count),
            view_count=int(channel.view_count),
        )
        confidence = maturity_confidence(maturity)
        now = datetime.now(timezone.utc)
        if profile:
            profile.channel_id = channel.id
            profile.profile_maturity = maturity
            profile.analysis_confidence = confidence
            profile.profile_mode = ProfileMode.analysis_assisted
            profile.sync_status = SyncStatus.essential_complete
            if niches:
                profile.niches_inferred = niches
                profile.niches_effective = niches[:3]
                profile.niche_source = NicheSource.channel_primary
            stats = dict(profile.channel_stats or {})
            stats.update({
                "subscriber_count": int(channel.subscriber_count),
                "video_count": int(channel.video_count),
                "view_count": int(channel.view_count),
                "engagement_rate": float(channel.engagement_rate) if channel.engagement_rate is not None else stats.get("engagement_rate", 4.5),
                "channel_name": channel.name,
                "handle": channel.handle,
                "thumbnail_url": channel.thumbnail_url,
            })
            profile.channel_stats = stats
            await db.flush()
        else:
            effective_niches = niches[:3] if niches else ["Tech", "Education"]
            await self.profile_repo.upsert(
                db,
                user_id=user_id,
                channel_id=channel.id,
                profile_maturity=maturity,
                analysis_confidence=confidence,
                profile_mode=ProfileMode.analysis_assisted,
                niches_onboarding=effective_niches,
                niches_inferred=niches,
                niches_effective=effective_niches,
                niche_source=NicheSource.channel_primary if niches else NicheSource.onboarding,
                content_format="both",
                posting_frequency="weekly",
                tone="conversational",
                geo_source=GeoSource.global_default,
                geo_target_country="India",
                audience_geo_weights={"IN": 0.45, "US": 0.40, "UK": 0.15},
                channel_stats={
                    "subscriber_count": int(channel.subscriber_count),
                    "video_count": int(channel.video_count),
                    "view_count": int(channel.view_count),
                    "engagement_rate": float(channel.engagement_rate) if channel.engagement_rate is not None else 4.5,
                    "channel_name": channel.name,
                    "handle": channel.handle,
                    "thumbnail_url": channel.thumbnail_url,
                },
                sync_status=SyncStatus.essential_complete,
                last_analyzed_at=now,
                onboarding_completed_at=now,
            )

        await db.commit()
        return {
            "data": {
                "id": str(channel.id),
                "youtube_channel_id": channel.youtube_channel_id,
                "name": channel.name,
                "is_primary": channel.is_primary,
            },
            "meta": {"request_id": "local-dev"},
        }

    async def patch_channel_analysis(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        *,
        engagement_rate: float | None,
        niches: list[str],
    ) -> dict:
        channel = await self.repo.patch_channel_analysis(
            db, user_id, engagement_rate=engagement_rate, niches=niches
        )
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "No channel found.", "details": {}},
            )
        await db.commit()
        return {"data": {"channel_id": str(channel.id), "niches": channel.niches}, "meta": {"request_id": "local-dev"}}

    async def patch_channel_geo(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        *,
        audience_geo_weights: dict[str, float],
        view_count: int,
    ) -> dict:
        channel = await self.repo.patch_channel_geo(
            db, user_id, audience_geo_weights=audience_geo_weights
        )
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "No channel found.", "details": {}},
            )

        profile = await self.profile_repo.get_by_user_id(db, user_id)
        if profile and view_count >= 1000:
            profile.audience_geo_weights = audience_geo_weights
            profile.geo_source = GeoSource.youtube_analytics
            await db.flush()

        await db.commit()
        return {
            "data": {
                "channel_id": str(channel.id),
                "audience_geo_weights": audience_geo_weights,
                "geo_source": GeoSource.youtube_analytics.value,
                "profile_updated": profile is not None and view_count >= 1000,
            },
            "meta": {"request_id": "local-dev"},
        }

    async def save_deep_sync(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        *,
        median_reach_ratio: float,
        dominant_traffic_source: str,
        speech_tempo_wpm: int,
        median_retention_30s_pct: float,
        analyzed_video_count: int,
        engagement_rate: float | None,
        niches: list[str],
        top_geos: dict[str, float],
        outliers: list[dict[str, Any]],
        detected_format: str | None = None,
        detected_frequency: str | None = None,
        subscriber_count: int | None = None,
        video_count: int | None = None,
        view_count: int | None = None,
        channel_name: str | None = None,
        handle: str | None = None,
        thumbnail_url: str | None = None,
    ) -> dict:
        """Store quota-efficient deep YouTube ingestion context (reach baseline, outliers, tempo)."""
        channel = await self.repo.get_primary_channel_by_user(db, user_id)
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "No channel found for user.", "details": {}},
            )

        if subscriber_count is not None:
            channel.subscriber_count = subscriber_count
        if video_count is not None:
            channel.video_count = video_count
        if view_count is not None:
            channel.view_count = view_count
        if channel_name:
            channel.name = channel_name
        if handle is not None:
            channel.handle = handle
        if thumbnail_url:
            channel.thumbnail_url = thumbnail_url

        channel.median_reach_ratio = median_reach_ratio
        channel.dominant_traffic_source = dominant_traffic_source
        channel.speech_tempo_wpm = speech_tempo_wpm
        channel.median_retention_30s_pct = median_retention_30s_pct
        if engagement_rate is not None:
            channel.engagement_rate = engagement_rate
        if niches:
            # Real YouTube channel niches override manual onboarding placeholders
            channel.niches = niches[:5]
        if detected_format:
            channel.content_formats = _content_format_enums(map_content_format(detected_format))
        if top_geos:
            channel.audience_geo_weights = top_geos
        await db.flush()

        # Record historical snapshot
        snapshot = ChannelHistoricalSnapshot(
            channel_id=channel.id,
            user_id=user_id,
            total_subscribers=int(channel.subscriber_count),
            total_views=int(channel.view_count),
            median_reach_ratio=median_reach_ratio,
            average_view_duration_seconds=180,
            median_retention_30s_pct=median_retention_30s_pct,
            speech_tempo_wpm=speech_tempo_wpm,
            dominant_traffic_source=dominant_traffic_source,
            top_geos=top_geos,
            analyzed_video_count=analyzed_video_count,
        )
        db.add(snapshot)

        # Replace top outlier videos
        if outliers:
            await self.repo.replace_channel_outliers(db, channel.id, outliers)

        # Update profile stats, niches, format, maturity & sync status to match connected channel
        profile = await self.profile_repo.get_by_user_id(db, user_id)
        maturity = classify_maturity(
            video_count=int(channel.video_count),
            subscriber_count=int(channel.subscriber_count),
            view_count=int(channel.view_count),
        )
        confidence = maturity_confidence(maturity)
        now = datetime.now(timezone.utc)
        if profile:
            profile.channel_id = channel.id
            profile.profile_maturity = maturity
            profile.analysis_confidence = confidence
            profile.profile_mode = ProfileMode.analysis_assisted
            profile.sync_status = SyncStatus.analysis_complete
            profile.last_analyzed_at = now
            if niches:
                profile.niches_inferred = niches
                profile.niches_effective = niches[:3]
                profile.niche_source = NicheSource.channel_primary
            if detected_format:
                profile.content_format = map_content_format(detected_format)
            if detected_frequency:
                profile.posting_frequency = detected_frequency
            if top_geos:
                profile.audience_geo_weights = top_geos
                profile.geo_source = GeoSource.youtube_analytics
            stats = dict(profile.channel_stats or {})
            stats.update({
                "subscriber_count": int(channel.subscriber_count),
                "video_count": int(channel.video_count),
                "view_count": int(channel.view_count),
                "channel_name": channel.name,
                "handle": channel.handle,
                "thumbnail_url": channel.thumbnail_url,
                "engagement_rate": float(channel.engagement_rate) if channel.engagement_rate is not None else 4.5,
                "median_reach_ratio": median_reach_ratio,
                "dominant_traffic_source": dominant_traffic_source,
                "speech_tempo_wpm": speech_tempo_wpm,
                "median_retention_30s_pct": median_retention_30s_pct,
                "analyzed_video_count": analyzed_video_count,
                "top_outliers": outliers,
            })
            profile.channel_stats = stats
            await db.flush()

        await db.commit()
        return {
            "data": {
                "channel_id": str(channel.id),
                "median_reach_ratio": median_reach_ratio,
                "dominant_traffic_source": dominant_traffic_source,
                "speech_tempo_wpm": speech_tempo_wpm,
                "median_retention_30s_pct": median_retention_30s_pct,
                "outliers_saved": len(outliers),
            },
            "meta": {"request_id": "local-dev"},
        }

    async def disconnect_oauth(self, db: AsyncSession, user_id: uuid.UUID) -> dict:
        """Unlink YouTube OAuth integration from channel service."""
        channel = await self.repo.get_primary_channel_by_user(db, user_id)
        if channel:
            channel.youtube_channel_id = f"manual-{user_id}"
            await db.flush()
        profile = await self.profile_repo.get_by_user_id(db, user_id)
        if profile:
            profile.sync_status = SyncStatus.pending
            await db.flush()
        await db.commit()
        return {"data": {"disconnected": True}, "meta": {"request_id": "local-dev"}}

    async def get_my_outliers(self, db: AsyncSession, user_id: uuid.UUID, limit: int = 5) -> dict:
        """Fetch historical breakout outliers for the primary channel."""
        channel = await self.repo.get_primary_channel_by_user(db, user_id)
        if not channel:
            return {"data": {"outliers": []}, "meta": {"request_id": "local-dev"}}
        outliers = await self.repo.get_channel_outliers(db, channel.id, limit=limit)
        return {
            "data": {
                "channel_id": str(channel.id),
                "median_reach_ratio": float(channel.median_reach_ratio) if getattr(channel, "median_reach_ratio", None) is not None else 0.35,
                "outliers": [
                    {
                        "youtube_video_id": o.youtube_video_id,
                        "title": o.title,
                        "published_at": o.published_at.isoformat() if o.published_at else None,
                        "view_count": int(o.view_count),
                        "reach_ratio": float(o.reach_ratio),
                        "format_type": o.format_type,
                    }
                    for o in outliers
                ],
            },
            "meta": {"request_id": "local-dev"},
        }

    async def get_my_channel(self, db: AsyncSession, user_id: uuid.UUID) -> dict:
        channel = await self.repo.get_primary_channel_by_user(db, user_id)
        if not channel:
            return {"data": {"channel": None, "connected": False}, "meta": {"request_id": "local-dev"}}

        maturity = classify_maturity(
            video_count=int(channel.video_count),
            subscriber_count=int(channel.subscriber_count),
            view_count=int(channel.view_count),
        )
        return {
            "data": {
                "connected": True,
                "channel": {
                    "id": str(channel.id),
                    "youtube_channel_id": channel.youtube_channel_id,
                    "name": channel.name,
                    "handle": channel.handle,
                    "thumbnail_url": channel.thumbnail_url,
                    "subscriber_count": int(channel.subscriber_count),
                    "video_count": int(channel.video_count),
                    "view_count": int(channel.view_count),
                    "engagement_rate": float(channel.engagement_rate) if channel.engagement_rate is not None else None,
                    "median_reach_ratio": float(channel.median_reach_ratio) if getattr(channel, "median_reach_ratio", None) is not None else 0.35,
                    "dominant_traffic_source": getattr(channel, "dominant_traffic_source", "browse") or "browse",
                    "speech_tempo_wpm": int(getattr(channel, "speech_tempo_wpm", 155) or 155),
                    "median_retention_30s_pct": float(channel.median_retention_30s_pct) if getattr(channel, "median_retention_30s_pct", None) is not None else 55.0,
                    "niches": channel.niches,
                    "is_primary": channel.is_primary,
                    "is_oauth_connected": bool(channel.youtube_channel_id and not channel.youtube_channel_id.startswith("manual-")),
                    "profile_maturity": maturity.value,
                },
            },
            "meta": {"request_id": "local-dev"},
        }

    async def get_analysis_status(self, db: AsyncSession, user_id: uuid.UUID) -> dict:
        channel = await self.repo.get_primary_channel_by_user(db, user_id)
        profile = await self.profile_repo.get_by_user_id(db, user_id)

        if not channel:
            return {
                "data": {
                    "connected": False,
                    "sync_status": "pending",
                    "profile_maturity": "new",
                    "message": "Connect your YouTube channel to continue.",
                },
                "meta": {"request_id": "local-dev"},
            }

        maturity = classify_maturity(
            video_count=int(channel.video_count),
            subscriber_count=int(channel.subscriber_count),
            view_count=int(channel.view_count),
        )
        sync_status = profile.sync_status.value if profile else (
            "analysis_limited" if maturity.value == "new" else "essential_complete"
        )
        return {
            "data": {
                "connected": True,
                "sync_status": sync_status,
                "profile_maturity": maturity.value,
                "video_count": int(channel.video_count),
                "detected_niches": channel.niches or [],
                "run_analysis": maturity.value != "new" and int(channel.video_count) > 0,
                "message": (
                    "New channel — set your profile manually. Reconfigure later when you have more videos."
                    if maturity.value == "new"
                    else "Channel analysis complete."
                ),
            },
            "meta": {"request_id": "local-dev"},
        }

    async def get_creator_profile(self, db: AsyncSession, user_id: uuid.UUID) -> dict:
        profile = await self.profile_repo.get_by_user_id(db, user_id)
        if not profile:
            profile_dict = await self.pipeline.run(
                db,
                user_id=user_id,
                mode="manual",
                niche=["Tech", "Entertainment"],
                primary_format="both",
                posting_frequency="weekly",
                channel_tone="conversational",
                country="India",
                run_analysis=False,
            )
            await db.commit()
            return {"data": profile_dict, "meta": {"request_id": "local-dev"}}
        return {"data": self.pipeline.serialize_profile(profile), "meta": {"request_id": "local-dev"}}

    async def update_creator_profile(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        *,
        niches: list[str] | None = None,
        content_format: str | None = None,
        tone: str | None = None,
        target_country: str | None = None,
    ) -> dict:
        profile = await self.profile_repo.get_by_user_id(db, user_id)
        if not profile:
            profile_dict = await self.pipeline.run(
                db,
                user_id=user_id,
                mode="manual",
                niche=niches or ["Tech", "Entertainment"],
                primary_format=content_format or "both",
                posting_frequency="weekly",
                channel_tone=tone or "conversational",
                country=target_country or "India",
                run_analysis=False,
            )
            await db.commit()
            return {"data": profile_dict, "meta": {"request_id": "local-dev"}}

        if niches is not None:
            profile.niches_onboarding = niches
            profile.niches_effective = niches
            from app.models.creator_profile_models import NicheSource
            profile.niche_source = NicheSource.onboarding
        if content_format is not None:
            from app.services.creator_context_pipeline import map_content_format
            profile.content_format = map_content_format(content_format)
        if tone is not None:
            profile.tone = tone
        if target_country is not None:
            from app.services.creator_context_pipeline import build_geo_weights
            profile.geo_target_country = target_country
            weights, geo_src = build_geo_weights(target_country)
            profile.audience_geo_weights = weights
            profile.geo_source = geo_src

        # Also sync to primary channel record if present
        channel = await self.repo.get_primary_channel_by_user(db, user_id)
        if channel:
            if niches is not None:
                channel.niches = niches
            if content_format is not None:
                from app.services.creator_context_pipeline import _content_format_enums
                channel.content_formats = _content_format_enums(profile.content_format)

        await db.commit()
        await db.refresh(profile)
        return {"data": self.pipeline.serialize_profile(profile), "meta": {"request_id": "local-dev"}}

    def _format_for_pipeline(self, content_format: str) -> str:
        if content_format == "long_form":
            return "long-form"
        if content_format == "both":
            return "hybrid"
        return content_format

    async def reconfigure_profile(self, db: AsyncSession, user_id: uuid.UUID) -> dict:
        profile = await self.profile_repo.get_by_user_id(db, user_id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Creator profile not found. Complete onboarding first.", "details": {}},
            )

        previous = self.pipeline.serialize_profile(profile)
        updated = await self.pipeline.run(
            db,
            user_id=user_id,
            mode="reconfigure",
            niche=list(profile.niches_onboarding),
            primary_format=self._format_for_pipeline(profile.content_format),
            posting_frequency=profile.posting_frequency or "weekly",
            channel_tone=profile.tone,
            country=profile.geo_target_country or "United States",
            run_analysis=None,
        )
        await db.commit()
        return {
            "data": {
                "profile": updated,
                "previous": previous,
                "changes": {
                    "niches_effective": {
                        "before": previous["niches"]["effective"],
                        "after": updated["niches"]["effective"],
                    },
                    "profile_maturity": {
                        "before": previous["profile_maturity"],
                        "after": updated["profile_maturity"],
                    },
                    "geo_source": {
                        "before": previous["geo"]["source"],
                        "after": updated["geo"]["source"],
                    },
                },
            },
            "meta": {"request_id": "local-dev"},
        }

    def refresh_metrics(self, channel_id: str) -> dict:
        return {
            "data": {"message": "Scaffolded internal endpoint: refresh-metrics", "channel_id": channel_id},
            "meta": {"request_id": "local-dev"},
        }

    async def get_user_channel_context(self, db: AsyncSession, user_id: uuid.UUID) -> dict:
        """Internal context method providing complete creator DNA to Copilot reasoning engine."""
        profile = await self.profile_repo.get_by_user_id(db, user_id)
        channel = await self.repo.get_primary_channel_by_user(db, user_id)

        outliers = []
        if channel:
            outliers = await self.repo.get_channel_outliers(db, channel.id, limit=5)

        is_connected = bool(channel and channel.youtube_channel_id and not channel.youtube_channel_id.startswith("manual-"))

        niches = []
        if profile and profile.niches_effective:
            niches = profile.niches_effective
        elif channel and channel.niches:
            niches = channel.niches

        content_formats = ["long_form", "shorts"]
        if profile and profile.content_format:
            content_formats = [profile.content_format] if profile.content_format != "both" else ["long_form", "shorts"]
        elif channel and channel.content_formats:
            content_formats = [f.value for f in channel.content_formats]

        tone = "conversational"
        if profile and profile.tone:
            tone = profile.tone
        elif channel and channel.tone:
            tone = channel.tone.value

        country = "India"
        if profile and profile.geo_target_country:
            country = profile.geo_target_country

        geo_weights = {}
        if profile and profile.audience_geo_weights:
            geo_weights = profile.audience_geo_weights
        elif channel and channel.audience_geo_weights:
            geo_weights = channel.audience_geo_weights

        top_outliers_serialized = [
            {
                "youtube_video_id": o.youtube_video_id,
                "title": o.title,
                "view_count": int(o.view_count),
                "reach_ratio": float(o.reach_ratio),
                "format_type": o.format_type,
            }
            for o in outliers
        ] if outliers else (
            profile.channel_stats.get("top_outliers", []) if profile and profile.channel_stats else []
        )

        return {
            "data": {
                "channel_name": channel.name if channel else None,
                "handle": channel.handle if channel else None,
                "subscriber_count": int(channel.subscriber_count) if channel else 0,
                "video_count": int(channel.video_count) if channel else 0,
                "view_count": int(channel.view_count) if channel else 0,
                "engagement_rate": float(channel.engagement_rate) if channel and channel.engagement_rate is not None else 4.5,
                "median_reach_ratio": float(channel.median_reach_ratio) if channel and getattr(channel, "median_reach_ratio", None) is not None else 0.35,
                "dominant_traffic_source": getattr(channel, "dominant_traffic_source", "browse") or "browse",
                "speech_tempo_wpm": int(getattr(channel, "speech_tempo_wpm", 155) or 155),
                "median_retention_30s_pct": float(channel.median_retention_30s_pct) if channel and getattr(channel, "median_retention_30s_pct", None) is not None else 55.0,
                "is_oauth_connected": is_connected,
                "niches": niches,
                "content_formats": content_formats,
                "tone": tone,
                "country": country,
                "top_geos": geo_weights,
                "top_outliers": top_outliers_serialized,
                "profile_maturity": profile.profile_maturity.value if profile else "new",
            },
            "meta": {"request_id": "local-dev"},
        }
