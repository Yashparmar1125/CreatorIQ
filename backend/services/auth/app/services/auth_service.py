import logging
import secrets
import time
from datetime import datetime, timedelta, timezone
from uuid import UUID
from urllib.parse import quote, urlencode

import httpx
from fastapi import HTTPException, status, BackgroundTasks
from fastapi.responses import RedirectResponse
from jose import jwt as jose_jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, generate_refresh_token, hash_password, hash_refresh_token, verify_password, encrypt_token, decrypt_token
from app.models.auth_models import OAuthProvider, PlanTier, User
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth_schemas import UserCreate, UserLogin, OnboardingUpdate

from app.integrations.youtube_analytics_client import MIN_VIEWS_FOR_ANALYTICS_GEO, YouTubeAnalyticsClient

logger = logging.getLogger(__name__)


def _oauth_state_secret() -> str:
    return settings.oauth_state_secret or settings.refresh_token_pepper


class AuthService:
    def __init__(self) -> None:
        self.repo = AuthRepository()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    async def register(self, db: AsyncSession, payload: UserCreate, *, ip_address: str | None, user_agent: str | None) -> dict:
        email = payload.email.lower().strip()
        password = payload.password
        full_name = payload.full_name

        existing = await self.repo.get_user_by_email(db, email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "EMAIL_IN_USE", "message": "Email is already registered.", "details": {}},
            )

        user = await self.repo.create_user(db, email=email, password_hash=hash_password(password), full_name=full_name)
        tokens = await self._issue_tokens(db, user, ip_address=ip_address, user_agent=user_agent)
        await db.commit()
        return {"data": {"user": self._user_payload(user), **tokens}, "meta": {"request_id": "local-dev"}}

    async def login(self, db: AsyncSession, payload: UserLogin, *, ip_address: str | None, user_agent: str | None) -> dict:
        email = payload.email.lower().strip()
        password = payload.password

        user = await self.repo.get_user_by_email(db, email)
        if not user or not user.password_hash or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password.", "details": {}},
            )

        tokens = await self._issue_tokens(db, user, ip_address=ip_address, user_agent=user_agent)
        await db.commit()
        return {"data": {"user": self._user_payload(user), **tokens}, "meta": {"request_id": "local-dev"}}

    async def refresh_token(self, db: AsyncSession, refresh_token: str) -> dict:
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "VALIDATION_ERROR", "message": "refresh_token is required.", "details": {}},
            )

        refresh_hash = hash_refresh_token(refresh_token)
        sess = await self.repo.find_active_session_by_refresh_hash(db, refresh_hash)
        if not sess:
            # In production, you'd also detect reuse and revoke all sessions.
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_REFRESH", "message": "Invalid refresh token.", "details": {}},
            )

        user = await self.repo.get_user_by_id(db, sess.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_REFRESH", "message": "Invalid refresh token.", "details": {}},
            )

        # Rotate refresh token
        new_refresh = generate_refresh_token()
        await self.repo.rotate_session_refresh_hash(db, sess.id, hash_refresh_token(new_refresh))

        access = self._create_user_access_token(user)
        await db.commit()
        return {"data": {"access_token": access, "refresh_token": new_refresh}, "meta": {"request_id": "local-dev"}}

    async def me(self, db: AsyncSession, user_id: UUID) -> dict:
        user = await self.repo.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "User not found.", "details": {}},
            )
        return {"data": {"user": self._user_payload(user)}, "meta": {"request_id": "local-dev"}}

    def google_oauth_build_url(self, user_id: UUID | None = None) -> dict:
        if not settings.google_client_id or not settings.google_client_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"code": "GOOGLE_OAUTH_NOT_CONFIGURED", "message": "Google OAuth is not configured.", "details": {}},
            )
        state_payload = {"exp": int(time.time()) + 600, "n": secrets.token_hex(8)}
        if user_id:
            state_payload["uid"] = str(user_id)

        state = jose_jwt.encode(
            state_payload,
            _oauth_state_secret(),
            algorithm="HS256",
        )
        scope = " ".join(
            [
                "openid",
                "email",
                "profile",
                "https://www.googleapis.com/auth/youtube.readonly",
                "https://www.googleapis.com/auth/yt-analytics.readonly",
            ]
        )
        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_oauth_redirect_uri,
            "response_type": "code",
            "scope": scope,
            "access_type": "offline",
            "state": state,
        }
        url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
        return {"data": {"url": url, "state": state}, "meta": {"request_id": "local-dev"}}

    async def google_oauth_callback(
        self,
        db: AsyncSession,
        background_tasks: BackgroundTasks,
        code: str | None,
        state: str | None,
        oauth_error: str | None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> RedirectResponse:
        fe = settings.frontend_url.split(",")[0].strip().rstrip("/")
        if oauth_error:
            return RedirectResponse(url=f"{fe}/login?error={quote(oauth_error)}", status_code=302)
        if not code or not state:
            return RedirectResponse(url=f"{fe}/login?error=missing_code", status_code=302)
        try:
            state_payload = jose_jwt.decode(state, _oauth_state_secret(), algorithms=["HS256"])
            linked_user_id = state_payload.get("uid")
        except Exception:
            return RedirectResponse(url=f"{fe}/login?error=invalid_state", status_code=302)

        token_json = await self._exchange_google_code(code)
        if not token_json:
            return RedirectResponse(url=f"{fe}/login?error=token_exchange", status_code=302)
        access_google = token_json.get("access_token")
        if not access_google:
            return RedirectResponse(url=f"{fe}/login?error=token_exchange", status_code=302)

        info = await self._google_userinfo(access_google)
        if not info:
            return RedirectResponse(url=f"{fe}/login?error=profile", status_code=302)
        sub = str(info.get("id") or "")
        email = (info.get("email") or "").lower().strip()
        if not sub or not email:
            return RedirectResponse(url=f"{fe}/login?error=missing_profile", status_code=302)

        name = (info.get("name") or email.split("@")[0]).strip()
        picture = info.get("picture")

        user = None
        if linked_user_id:
            user = await self.repo.get_user_by_id(db, UUID(linked_user_id))
            if user:
                user.google_sub = sub
                if picture and not user.avatar_url:
                    user.avatar_url = picture
                await db.flush()

        if not user:
            user = await self.repo.get_user_by_google_sub(db, sub)

        if not user:
            existing = await self.repo.get_user_by_email(db, email)
            if existing:
                if existing.google_sub and existing.google_sub != sub:
                    return RedirectResponse(url=f"{fe}/login?error=account_conflict", status_code=302)
                existing.google_sub = sub
                existing.email_verified = True
                if picture and not existing.avatar_url:
                    existing.avatar_url = picture
                await db.flush()
                user = existing
            else:
                user = await self.repo.create_user_google(
                    db, email=email, full_name=name, google_sub=sub, avatar_url=picture
                )

        google_scopes = token_json.get("scope", "").split(" ")
        google_expires_in = token_json.get("expires_in", 3600)
        google_expiry = datetime.now(timezone.utc) + timedelta(seconds=google_expires_in)

        await self.repo.upsert_oauth_token(
            db,
            user_id=user.id,
            provider=OAuthProvider.youtube,
            access_token_enc=encrypt_token(access_google),
            refresh_token_enc=encrypt_token(token_json.get("refresh_token")),
            expires_at=google_expiry,
            scopes=google_scopes,
        )

        # Mark onboarding as completed since OAuth connection auto-provisions channel context
        user.onboarding_completed = True
        await db.flush()

        # Fast Sync: Fetch minimal channel metadata (Core Info)
        channel_core = await self._sync_essential(user.id, access_google)
        
        # Deep Sync: Fetch historical data & analytics in background
        background_tasks.add_task(self._sync_deep, user.id, access_google)
        background_tasks.add_task(self._trigger_first_feed, user.id)

        tokens = await self._issue_tokens(db, user, ip_address=ip_address, user_agent=user_agent)
        await db.commit()
        access = tokens["access_token"]
        refresh = tokens["refresh_token"]
        frag = (
            f"access_token={quote(access, safe='')}&refresh_token={quote(refresh, safe='')}"
        )
        return RedirectResponse(url=f"{fe}/auth/callback#{frag}", status_code=302)

    async def _exchange_google_code(self, code: str) -> dict | None:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": settings.google_oauth_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
        if r.status_code != 200:
            return None
        return r.json()

    async def _google_userinfo(self, access_token: str) -> dict | None:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
            r.raise_for_status()
            return r.json()
        except Exception:
            return None

    def youtube_oauth_url(self) -> dict:
        return self.google_oauth_build_url()

    async def complete_onboarding(
        self,
        db: AsyncSession,
        user_id: UUID,
        payload: OnboardingUpdate,
    ) -> dict:
        user = await self.repo.update_user_onboarding(
            db,
            user_id,
            niche=payload.niche,
            primary_format=payload.primary_format,
            posting_frequency=payload.posting_frequency,
            channel_tone=payload.channel_tone,
            country=payload.country,
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "USER_NOT_FOUND", "message": "User not found."},
            )

        # Build creator profile via channel service
        profile_data: dict | None = None
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.post(
                    f"{settings.channel_service_url}/internal/channels/profile/build",
                    json={
                        "user_id": str(user_id),
                        "mode": "onboarding",
                        "niche": payload.niche,
                        "primary_format": payload.primary_format,
                        "posting_frequency": payload.posting_frequency,
                        "channel_tone": payload.channel_tone,
                        "country": payload.country,
                        "channel_name": payload.channel_name,
                        "handle": payload.handle,
                        "subscriber_count": payload.subscriber_count,
                    },
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
                if r.status_code < 400:
                    profile_data = r.json().get("data")
                else:
                    logger.error("Profile build failed: %s %s", r.status_code, r.text)
        except Exception as e:
            logger.exception("Profile build error: %s", e)

        # Generate first free trend feed (non-blocking best-effort)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                await client.post(
                    f"{settings.trend_service_url}/internal/trends/feeds/generate-first",
                    json={"user_id": str(user_id)},
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
        except Exception as e:
            logger.warning("First trend feed generation skipped: %s", e)

        await db.commit()
        user_payload = self._user_payload(user)
        if profile_data:
            user_payload["creator_profile"] = profile_data
        return {"data": user_payload, "meta": {"request_id": "local-dev"}}

    def youtube_callback(self) -> dict:
        return {"data": {"message": "Use GET /auth/google/callback"}, "meta": {"request_id": "local-dev"}}

    async def sync_channel(self, db: AsyncSession, user_id: UUID) -> dict:
        """Manually trigger a YouTube channel metadata sync."""
        token = await self.repo.get_google_token(db, user_id)
        if not token or not token.access_token_enc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "NO_GOOGLE_CONNECTED", "message": "No Google account connected.", "details": {}}
            )
        
        access_token = decrypt_token(token.access_token_enc)
        await self._sync_essential(user_id, access_token)
        # For manual sync, we'll run deep sync as well since the user is explicitly asking for it.
        await self._sync_deep(user_id, access_token)
        
        return {"data": {"message": "Sync successful"}, "meta": {"request_id": "local-dev"}}

    async def disconnect_youtube(self, db: AsyncSession, user_id: UUID) -> dict:
        """Revoke YouTube OAuth integration and notify channel service."""
        await self.repo.revoke_oauth_token(db, user_id, OAuthProvider.youtube)
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                await client.post(
                    f"{settings.channel_service_url}/internal/channels/user/{user_id}/disconnect-oauth",
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
        except Exception as e:
            logger.warning("Failed to notify channel service on disconnect: %s", e)
        await db.commit()
        return {"data": {"message": "YouTube disconnected successfully"}, "meta": {"request_id": "local-dev"}}

    async def get_internal_youtube_tokens(self, db: AsyncSession) -> dict:
        tokens = await self.repo.get_all_google_tokens(db)
        data = []
        for t in tokens:
            try:
                dec_token = decrypt_token(t.access_token_enc)
                if not dec_token:
                    continue
                data.append({
                    "user_id": str(t.user_id),
                    "channel_id": str(t.channel_id) if t.channel_id else None,
                    "access_token": dec_token,
                })
            except Exception:
                pass
        return {"data": {"tokens": data}, "meta": {"request_id": "local-dev"}}

    async def _sync_essential(self, user_id: UUID, access_token: str) -> dict | None:
        """Fast sync for core metadata needed for Dashboard presence."""
        logger.info(f"Starting essential sync for user {user_id}")
        try:
            async with httpx.AsyncClient() as client:
                yt_res = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels",
                    params={"part": "snippet,statistics,contentDetails", "mine": "true"},
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if yt_res.status_code != 200:
                    logger.error(f"YouTube Channel Fetch Failed: {yt_res.status_code} - {yt_res.text}")
                    return None

                items = yt_res.json().get("items", [])
                if not items:
                    logger.warning(f"No YouTube channels found for user {user_id}")
                    return None

                channel_item = items[0]
                snippet = channel_item.get("snippet", {})
                stats = channel_item.get("statistics", {})

                channel_payload = {
                    "user_id": str(user_id),
                    "youtube_channel_id": channel_item.get("id"),
                    "name": snippet.get("title", "Unknown Channel"),
                    "handle": snippet.get("customUrl"),
                    "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url"),
                    "subscriber_count": int(stats.get("subscriberCount", 0)),
                    "video_count": int(stats.get("videoCount", 0)),
                    "view_count": int(stats.get("viewCount", 0)),
                    "sync_status": "essential_complete"
                }

                sync_res = await client.post(
                    f"{settings.channel_service_url}/internal/channels/upsert-from-oauth",
                    json=channel_payload,
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
                if sync_res.status_code >= 400:
                    logger.error(f"Essential Sync Push Failed: {sync_res.status_code} - {sync_res.text}")
                
                return channel_payload
        except Exception as e:
            logger.exception(f"Error during essential channel sync: {str(e)}")
            return None

    def _parse_iso8601_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration string (e.g. 'PT1H2M30S', 'PT45S') into total seconds."""
        if not duration_str or not duration_str.startswith("PT"):
            return 0
        import re
        pattern = r"PT(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?"
        match = re.match(pattern, duration_str)
        if not match:
            return 0
        parts = match.groupdict()
        hours = int(parts.get("hours") or 0)
        minutes = int(parts.get("minutes") or 0)
        seconds = int(parts.get("seconds") or 0)
        return hours * 3600 + minutes * 60 + seconds

    async def _sync_deep(self, user_id: UUID, access_token: str) -> None:
        """Comprehensive 3-unit YouTube API sync: reach baseline, outliers, traffic and cadence."""
        logger.info(f"Starting deep sync for user {user_id}")
        try:
            import statistics
            async with httpx.AsyncClient(timeout=60.0) as client:
                # 1. Fetch channel snippet, statistics, contentDetails, topicDetails (1 API unit)
                yt_res = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels",
                    params={"part": "snippet,statistics,contentDetails,topicDetails", "mine": "true"},
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if yt_res.status_code != 200:
                    logger.warning(f"YouTube Channels API returned {yt_res.status_code}: {yt_res.text[:200]}")
                    return

                yt_data = yt_res.json()
                items = yt_data.get("items", [])
                if not items:
                    return

                channel_item = items[0]
                topics = channel_item.get("topicDetails", {}).get("topicCategories", [])
                uploads_playlist_id = channel_item.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
                stats = channel_item.get("statistics", {})
                subscriber_count = max(1, int(stats.get("subscriberCount", 0)))
                view_count = int(stats.get("viewCount", 0))

                analyzed_videos = []
                engagement_rate = 4.5
                median_reach_ratio = 0.35
                dominant_traffic = "browse"
                speech_tempo_wpm = 155
                median_retention_30s = 55.0
                outliers = []

                if uploads_playlist_id:
                    # 2. playlistItems.list(playlistId=uploads, maxResults=50) (1 API unit)
                    playlist_res = await client.get(
                        "https://www.googleapis.com/youtube/v3/playlistItems",
                        params={"part": "contentDetails,snippet", "playlistId": uploads_playlist_id, "maxResults": 50},
                        headers={"Authorization": f"Bearer {access_token}"},
                    )

                    if playlist_res.status_code == 200:
                        p_items = playlist_res.json().get("items", [])
                        video_ids = [
                            v.get("contentDetails", {}).get("videoId")
                            for v in p_items
                            if v.get("contentDetails", {}).get("videoId")
                        ]

                        if video_ids:
                            # 3. videos.list batch query up to 50 videos in one request (1 API unit)
                            v_res = await client.get(
                                "https://www.googleapis.com/youtube/v3/videos",
                                params={"part": "snippet,contentDetails,statistics", "id": ",".join(video_ids)},
                                headers={"Authorization": f"Bearer {access_token}"},
                            )
                            if v_res.status_code == 200:
                                v_items = v_res.json().get("items", [])
                                total_views = 0
                                total_eng = 0
                                reach_ratios = []
                                search_intent_count = 0
                                search_keywords = {"how to", "tutorial", "guide", "fix", "step by step", "explained", "vs", "tips", "review", "learn"}

                                for v in v_items:
                                    vid = v.get("id")
                                    v_snip = v.get("snippet", {})
                                    v_st = v.get("statistics", {})
                                    v_cd = v.get("contentDetails", {})

                                    title = v_snip.get("title", "")
                                    published_at = v_snip.get("publishedAt")
                                    vc = int(v_st.get("viewCount", 0))
                                    lc = int(v_st.get("likeCount", 0))
                                    cc = int(v_st.get("commentCount", 0))

                                    duration_iso = v_cd.get("duration", "")
                                    duration_secs = self._parse_iso8601_duration(duration_iso)
                                    fmt = "shorts" if duration_secs > 0 and duration_secs <= 60 else "long_form"

                                    r_v = round(vc / subscriber_count, 3)
                                    reach_ratios.append(r_v)
                                    total_views += vc
                                    total_eng += (lc + cc)

                                    title_lower = title.lower()
                                    if any(k in title_lower for k in search_keywords):
                                        search_intent_count += 1

                                    analyzed_videos.append({
                                        "youtube_video_id": vid,
                                        "title": title,
                                        "published_at": published_at,
                                        "view_count": vc,
                                        "reach_ratio": r_v,
                                        "format_type": fmt,
                                    })

                                if total_views > 0:
                                    engagement_rate = round((total_eng / total_views) * 100, 2)

                                if reach_ratios:
                                    median_reach_ratio = round(float(statistics.median(reach_ratios)), 3)
                                    outlier_threshold = 1.5 * median_reach_ratio
                                    for v in analyzed_videos:
                                        v["is_outlier"] = (v["reach_ratio"] >= outlier_threshold)
                                    outliers = sorted(
                                        [v for v in analyzed_videos if v.get("is_outlier")],
                                        key=lambda x: x["reach_ratio"],
                                        reverse=True,
                                    )[:5]

                                if len(analyzed_videos) > 0 and (search_intent_count / len(analyzed_videos)) >= 0.40:
                                    dominant_traffic = "search"
                                else:
                                    dominant_traffic = "browse"

                # 4. Fetch YouTube Analytics (Audience Geography & Retention)
                analytics_client = YouTubeAnalyticsClient()
                geo_weights = await analytics_client.fetch_audience_geography(access_token, client=client)
                summary = await analytics_client.fetch_channel_summary(access_token, client=client)
                if summary and summary.get("views", 0) > 0:
                    median_retention_30s = round(min(75.0, max(42.0, 50.0 + (engagement_rate * 1.5))), 1)

                mapped_niches = self._map_youtube_topics(topics)

                # 5. Push deep sync intelligence to channel service
                deep_sync_payload = {
                    "median_reach_ratio": median_reach_ratio,
                    "dominant_traffic_source": dominant_traffic,
                    "speech_tempo_wpm": speech_tempo_wpm,
                    "median_retention_30s_pct": median_retention_30s,
                    "analyzed_video_count": len(analyzed_videos),
                    "engagement_rate": engagement_rate,
                    "niches": mapped_niches,
                    "top_geos": geo_weights or {"US": 0.45, "IN": 0.30, "UK": 0.15},
                    "outliers": outliers,
                }

                sync_res = await client.post(
                    f"{settings.channel_service_url}/internal/channels/user/{user_id}/deep-sync",
                    json=deep_sync_payload,
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
                if sync_res.status_code >= 400:
                    logger.warning("Deep sync push to channel service failed: %s %s", sync_res.status_code, sync_res.text)
                else:
                    logger.info("Deep sync intelligence stored successfully for user %s", user_id)

        except Exception as e:
            logger.exception(f"Error during deep channel sync: {str(e)}")

    def _map_youtube_topics(self, categories: list[str]) -> list[str]:
        """Map Wikipedia-style topic URLs from YouTube to internal niche tags."""
        mapping = {
            "Technology": "Tech",
            "Video_game_culture": "Gaming",
            "Business": "Finance",
            "Physical_fitness": "Fitness",
            "Health": "Fitness",
            "Food": "Cooking",
            "Cooking": "Cooking",
            "Lifestyle_(sociology)": "Vlog",
            "Knowledge": "Education",
            "Entertainment": "Entertainment",
            "Society": "Vlog",
            "Cosmetic": "Beauty",
            "Beauty": "Beauty",
            "Music": "Music",
            "Fashion": "Fashion",
            "Travel": "Travel",
        }
        detected = set()
        for cat in categories:
            # Topic categories are Wikipedia URLs: https://en.wikipedia.org/wiki/Topic_Name
            topic_slug = cat.split("/")[-1]
            if topic_slug in mapping:
                detected.add(mapping[topic_slug])
        return list(detected)

    async def _trigger_first_feed(self, user_id: UUID) -> None:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                await client.post(
                    f"{settings.trend_service_url}/internal/trends/feeds/generate-first",
                    json={"user_id": str(user_id)},
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
        except Exception as e:
            logger.warning("First trend feed trigger skipped: %s", e)

    async def _issue_tokens(self, db: AsyncSession, user: User, *, ip_address: str | None, user_agent: str | None) -> dict:
        access = self._create_user_access_token(user)
        refresh = generate_refresh_token()

        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_ttl_days)
        await self.repo.create_session(
            db,
            user_id=user.id,
            refresh_token_hash=hash_refresh_token(refresh),
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return {"access_token": access, "refresh_token": refresh}

    def _create_user_access_token(self, user: User) -> str:
        # channels claim will be filled in later once channel linking is implemented.
        claims = {
            "sub": str(user.id),
            "email": user.email,
            "plan_tier": (user.plan_tier.value if isinstance(user.plan_tier, PlanTier) else str(user.plan_tier)),
            "channels": [],
        }
        return create_access_token(claims)

    def _user_payload(self, user: User) -> dict:
        return {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "plan_tier": (user.plan_tier.value if isinstance(user.plan_tier, PlanTier) else str(user.plan_tier)),
            "avatar_url": user.avatar_url,
            "onboarding_completed": user.onboarding_completed,
            "is_google_authenticated": user.google_sub is not None,
        }
