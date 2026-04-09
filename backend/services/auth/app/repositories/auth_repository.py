import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth_models import OAuthProvider, OAuthToken, Session, User


class AuthRepository:
    def health_payload(self) -> dict:
        return {"service": "auth", "status": "ok"}

    async def get_user_by_email(self, db: AsyncSession, email: str) -> User | None:
        res = await db.execute(select(User).where(User.email == email, User.deleted_at.is_(None)))
        return res.scalar_one_or_none()

    async def get_user_by_google_sub(self, db: AsyncSession, google_sub: str) -> User | None:
        res = await db.execute(select(User).where(User.google_sub == google_sub, User.deleted_at.is_(None)))
        return res.scalar_one_or_none()

    async def get_user_by_id(self, db: AsyncSession, user_id: uuid.UUID) -> User | None:
        res = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
        return res.scalar_one_or_none()

    async def create_user(self, db: AsyncSession, *, email: str, password_hash: str, full_name: str) -> User:
        user = User(email=email.lower().strip(), password_hash=password_hash, full_name=full_name)
        db.add(user)
        await db.flush()
        return user

    async def create_user_google(
        self,
        db: AsyncSession,
        *,
        email: str,
        full_name: str,
        google_sub: str,
        avatar_url: str | None = None,
    ) -> User:
        user = User(
            email=email.lower().strip(),
            password_hash=None,
            full_name=full_name,
            google_sub=google_sub,
            email_verified=True,
            avatar_url=avatar_url,
        )
        db.add(user)
        await db.flush()
        return user

    async def create_session(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        refresh_token_hash: str,
        expires_at: datetime,
        ip_address: str | None,
        user_agent: str | None,
    ) -> Session:
        sess = Session(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            revoked=False,
        )
        db.add(sess)
        await db.flush()
        return sess

    async def find_active_session_by_refresh_hash(self, db: AsyncSession, refresh_token_hash: str) -> Session | None:
        now = datetime.now(timezone.utc)
        res = await db.execute(
            select(Session).where(
                Session.refresh_token_hash == refresh_token_hash,
                Session.revoked.is_(False),
                Session.expires_at > now,
            )
        )
        return res.scalar_one_or_none()

    async def rotate_session_refresh_hash(self, db: AsyncSession, session_id: uuid.UUID, new_hash: str) -> None:
        await db.execute(update(Session).where(Session.id == session_id).values(refresh_token_hash=new_hash))

    async def revoke_user_sessions(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        await db.execute(update(Session).where(Session.user_id == user_id).values(revoked=True))

    async def upsert_oauth_token(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        provider: OAuthProvider,
        access_token_enc: str,
        refresh_token_enc: str | None,
        expires_at: datetime,
        scopes: list[str],
    ) -> OAuthToken:
        res = await db.execute(select(OAuthToken).where(OAuthToken.user_id == user_id, OAuthToken.provider == provider))
        existing = res.scalar_one_or_none()

        if existing:
            existing.access_token_enc = access_token_enc
            if refresh_token_enc:
                existing.refresh_token_enc = refresh_token_enc
            existing.token_expiry = expires_at
            existing.scopes = scopes
            existing.revoked = False
            await db.flush()
            return existing
        else:
            token = OAuthToken(
                user_id=user_id,
                provider=provider,
                access_token_enc=access_token_enc,
                refresh_token_enc=refresh_token_enc or "",
                token_expiry=expires_at,
                scopes=scopes,
            )
            db.add(token)
            await db.flush()
            return token

    async def has_user_oauth_token(self, db: AsyncSession, user_id: uuid.UUID, provider: OAuthProvider) -> bool:
        res = await db.execute(
            select(OAuthToken).where(
                OAuthToken.user_id == user_id, OAuthToken.provider == provider, OAuthToken.revoked.is_(False)
            )
        )
        return res.scalar_one_or_none() is not None

    async def get_google_token(self, db: AsyncSession, user_id: uuid.UUID) -> OAuthToken | None:
        res = await db.execute(
            select(OAuthToken).where(
                OAuthToken.user_id == user_id,
                OAuthToken.provider == OAuthProvider.youtube,
                OAuthToken.revoked.is_(False)
            )
        )
        return res.scalar_one_or_none()

    async def get_google_token_by_channel(self, db: AsyncSession, channel_id: uuid.UUID) -> OAuthToken | None:
        res = await db.execute(
            select(OAuthToken).where(
                OAuthToken.channel_id == channel_id,
                OAuthToken.provider == OAuthProvider.youtube,
                OAuthToken.revoked.is_(False)
            )
        )
        return res.scalar_one_or_none()

    async def get_all_google_tokens(self, db: AsyncSession) -> list[OAuthToken]:
        res = await db.execute(
            select(OAuthToken).where(
                OAuthToken.provider == OAuthProvider.youtube,
                OAuthToken.revoked.is_(False)
            )
        )
        return list(res.scalars().all())

    async def update_user_onboarding(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        *,
        niche: list[str],
        primary_format: str,
        posting_frequency: str,
        channel_tone: str,
        country: str,
    ) -> User | None:
        user = await self.get_user_by_id(db, user_id)
        if not user:
            return None

        user.niche = niche
        user.primary_format = primary_format
        user.posting_frequency = posting_frequency
        user.channel_tone = channel_tone
        user.country = country
        user.onboarding_completed = True
        
        await db.flush()
        return user
