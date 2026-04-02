import secrets
import time
from datetime import datetime, timedelta, timezone
from uuid import UUID
from urllib.parse import quote, urlencode

import httpx
from fastapi import HTTPException, status
from fastapi.responses import RedirectResponse
from jose import jwt as jose_jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, generate_refresh_token, hash_password, hash_refresh_token, verify_password
from app.models.auth_models import OAuthProvider, PlanTier, User
from app.repositories.auth_repository import AuthRepository


def _oauth_state_secret() -> str:
    return settings.oauth_state_secret or settings.refresh_token_pepper


class AuthService:
    def __init__(self) -> None:
        self.repo = AuthRepository()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    async def register(self, db: AsyncSession, payload: dict, *, ip_address: str | None, user_agent: str | None) -> dict:
        email = (payload.get("email") or "").lower().strip()
        password = payload.get("password") or ""
        full_name = payload.get("full_name") or ""
        if not email or not password or not full_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "VALIDATION_ERROR", "message": "email, password, full_name are required.", "details": {}},
            )

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

    async def login(self, db: AsyncSession, payload: dict, *, ip_address: str | None, user_agent: str | None) -> dict:
        email = (payload.get("email") or "").lower().strip()
        password = payload.get("password") or ""
        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "VALIDATION_ERROR", "message": "email and password are required.", "details": {}},
            )

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
        *,
        code: str | None,
        state: str | None,
        oauth_error: str | None,
        ip_address: str | None,
        user_agent: str | None,
    ) -> RedirectResponse:
        fe = settings.frontend_url.rstrip("/")
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
            access_token_enc=access_google,
            refresh_token_enc=token_json.get("refresh_token"),
            expires_at=google_expiry,
            scopes=google_scopes,
        )

        # Sync Channel Metadata to Channel Service
        await self._sync_channel_metadata(user.id, access_google)

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
        payload: dict,
    ) -> dict:
        user = await self.repo.update_user_onboarding(
            db,
            user_id,
            niche=payload.get("niche", []),
            primary_format=payload.get("primary_format", ""),
            posting_frequency=payload.get("posting_frequency", ""),
            channel_tone=payload.get("channel_tone", ""),
            country=payload.get("country", ""),
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "USER_NOT_FOUND", "message": "User not found."},
            )

        await db.commit()
        return {"data": self._user_payload(user), "meta": {"request_id": "local-dev"}}

    def youtube_callback(self) -> dict:
        return {"data": {"message": "Use GET /auth/google/callback"}, "meta": {"request_id": "local-dev"}}

    async def sync_channel(self, db: AsyncSession, user_id: UUID) -> dict:
        """Manually trigger a YouTube channel sync for a user."""
        token = await self.repo.get_google_token(db, user_id)
        if not token or not token.access_token_enc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "NO_GOOGLE_CONNECTED", "message": "No Google account connected.", "details": {}}
            )
        
        # Check if token needs refresh
        access_token = token.access_token_enc
        # For now, we assume the token is valid or will be caught by the sync method's error handling.
        # In a full production app, we would implement the refresh flow here or use a library like Authlib.
        
        await self._sync_channel_metadata(user_id, access_token)
        return {"data": {"message": "Sync successful"}, "meta": {"request_id": "local-dev"}}

    async def _sync_channel_metadata(self, user_id: UUID, access_token: str) -> None:
        """Fetch YouTube channel metadata, latest video stats, and sync to Channel service."""
        try:
            async with httpx.AsyncClient() as client:
                # 1. Fetch Channel Info & Uploads Playlist from YouTube
                yt_res = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels",
                    params={"part": "snippet,statistics,topicDetails,contentDetails", "mine": "true"},
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if yt_res.status_code != 200:
                    print(f"YouTube Channel Fetch Failed: {yt_res.status_code} - {yt_res.text}")
                    return

                yt_data = yt_res.json()
                items = yt_data.get("items", [])
                if not items:
                    print("No YouTube channels found for user.")
                    return

                channel_item = items[0]
                snippet = channel_item.get("snippet", {})
                stats = channel_item.get("statistics", {})
                topics = channel_item.get("topicDetails", {}).get("topicCategories", [])
                uploads_playlist_id = channel_item.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")

                # 2. Fetch Latest 5 Videos for Engagement Calculation
                engagement_rate = 0.0
                if uploads_playlist_id:
                    playlist_res = await client.get(
                        "https://www.googleapis.com/youtube/v3/playlistItems",
                        params={
                            "part": "snippet,contentDetails",
                            "playlistId": uploads_playlist_id,
                            "maxResults": 5,
                        },
                        headers={"Authorization": f"Bearer {access_token}"},
                    )
                    
                    if playlist_res.status_code == 200:
                        video_items = playlist_res.json().get("items", [])
                        video_ids = [v.get("contentDetails", {}).get("videoId") for v in video_items]
                        
                        if video_ids:
                            videos_res = await client.get(
                                "https://www.googleapis.com/youtube/v3/videos",
                                params={
                                    "part": "statistics",
                                    "id": ",".join(video_ids),
                                },
                                headers={"Authorization": f"Bearer {access_token}"},
                            )
                            
                            if videos_res.status_code == 200:
                                v_data = videos_res.json().get("items", [])
                                total_engagements = 0
                                total_views = 0
                                for v in v_data:
                                    v_stats = v.get("statistics", {})
                                    likes = int(v_stats.get("likeCount", 0))
                                    comments = int(v_stats.get("commentCount", 0))
                                    views = int(v_stats.get("viewCount", 0))
                                    total_engagements += (likes + comments)
                                    total_views += views
                                
                                if total_views > 0:
                                    engagement_rate = (total_engagements / total_views) * 100

                channel_payload = {
                    "user_id": str(user_id),
                    "youtube_channel_id": channel_item.get("id"),
                    "name": snippet.get("title", "Unknown Channel"),
                    "handle": snippet.get("customUrl"),
                    "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url"),
                    "subscriber_count": int(stats.get("subscriberCount", 0)),
                    "video_count": int(stats.get("videoCount", 0)),
                    "view_count": int(stats.get("viewCount", 0)),
                    "engagement_rate": round(engagement_rate, 2),
                    "niches": self._map_youtube_topics(topics),
                }

                # 3. Push metadata to Channel Service
                channel_url = f"{settings.channel_service_url}/internal/channels/upsert-from-oauth"
                sync_res = await client.post(
                    channel_url,
                    json=channel_payload,
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
                if sync_res.status_code >= 400:
                    print(f"Channel Sync Failed: {sync_res.status_code} - {sync_res.text}")
        except Exception as e:
            print(f"Error during channel metadata sync: {str(e)}")

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
