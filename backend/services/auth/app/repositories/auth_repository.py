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

    async def create_user(
        self,
        db: AsyncSession,
        *,
        email: str,
        password_hash: str | None,
        full_name: str | None,
    ) -> User:
        user = User(email=email, password_hash=password_hash, full_name=full_name)
        db.add(user)
        await db.flush()
        return user

    async def create_user_google(
        self,
        db: AsyncSession,
        *,
        email: str,
        full_name: str | None,
        google_sub: str,
        avatar_url: str | None,
    ) -> User:
        user = User(
            email=email,
            password_hash=None,
            full_name=full_name,
            google_sub=google_sub,
            avatar_url=avatar_url,
            email_verified=True,
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
        user_agent: str | None,
        ip_address: str | None,
    ) -> Session:
        session = Session(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        db.add(session)
        await db.flush()
        return session

    async def get_valid_session(self, db: AsyncSession, refresh_token_hash: str) -> Session | None:
        now = datetime.now(timezone.utc)
        res = await db.execute(
            select(Session).where(
                Session.refresh_token_hash == refresh_token_hash,
                Session.revoked_at.is_(None),
                Session.expires_at > now,
            )
        )
        return res.scalar_one_or_none()

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
        res = await db.execute(
            select(OAuthToken).where(OAuthToken.user_id == user_id, OAuthToken.provider == provider)
        )
        existing = res.scalar_one_or_none()
        if existing:
            existing.access_token_enc = access_token_enc
            if refresh_token_enc:
                existing.refresh_token_enc = refresh_token_enc
            existing.token_expiry = expires_at
            existing.scopes = scopes
            existing.revoked = False
            existing.updated_at = datetime.now(timezone.utc)
            await db.flush()
            return existing

        token = OAuthToken(
            user_id=user_id,
            provider=provider,
            access_token_enc=access_token_enc,
            refresh_token_enc=refresh_token_enc,
            token_expiry=expires_at,
            scopes=scopes,
            revoked=False,
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

    async def get_all_google_tokens(self, db: AsyncSession) -> list[OAuthToken]:
        res = await db.execute(
            select(OAuthToken).where(
                OAuthToken.provider == OAuthProvider.youtube,
                OAuthToken.revoked.is_(False)
            )
        )
        return list(res.scalars().all())

    async def revoke_oauth_token(self, db: AsyncSession, user_id: uuid.UUID, provider: OAuthProvider) -> bool:
        res = await db.execute(
            update(OAuthToken)
            .where(OAuthToken.user_id == user_id, OAuthToken.provider == provider)
            .values(revoked=True)
        )
        await db.flush()
        return (res.rowcount or 0) > 0

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
        res = await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                niche=niche,
                primary_format=primary_format,
                posting_frequency=posting_frequency,
                channel_tone=channel_tone,
                country=country,
                onboarding_completed=True,
            )
            .returning(User)
        )
        return res.scalar_one_or_none()
