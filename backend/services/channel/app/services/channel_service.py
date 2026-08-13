import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.creator_profile_models import GeoSource
from app.repositories.channel_repository import ChannelRepository
from app.repositories.creator_profile_repository import CreatorProfileRepository
from app.services.creator_context_pipeline import CreatorContextPipeline, classify_maturity


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
                        "niches": c.niches,
                        "is_primary": c.is_primary,
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
        # Partial update (deep sync analysis only)
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
                    "niches": channel.niches,
                    "is_primary": channel.is_primary,
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Creator profile not found. Complete onboarding first.", "details": {}},
            )
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Creator profile not found. Complete onboarding first.", "details": {}},
            )

        if niches is not None:
            profile.niches_onboarding = niches
            profile.niches_effective = niches
            from app.models.creator_profile_models import NicheSource
            profile.niche_source = NicheSource.onboarding
        if content_format is not None:
            profile.content_format = content_format
        if tone is not None:
            profile.tone = tone
        if target_country is not None:
            profile.geo_target_country = target_country

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
        profile = await self.profile_repo.get_by_user_id(db, user_id)
        if profile:
            return {
                "data": {
                    "niches": profile.niches_effective,
                    "content_formats": [profile.content_format] if profile.content_format != "both" else ["long_form", "shorts"],
                    "tone": profile.tone,
                    "profile_maturity": profile.profile_maturity.value,
                    "geo": {
                        "source": profile.geo_source.value,
                        "audience_weights": profile.audience_geo_weights,
                    },
                },
                "meta": {"request_id": "local-dev"},
            }

        channel = await self.repo.get_primary_channel_by_user(db, user_id)
        if not channel:
            return {
                "data": {"niches": [], "content_formats": [], "tone": "mixed"},
                "meta": {"request_id": "local-dev"},
            }
        return {
            "data": {
                "niches": channel.niches,
                "content_formats": [f.value for f in channel.content_formats],
                "tone": channel.tone.value,
            },
            "meta": {"request_id": "local-dev"},
        }
