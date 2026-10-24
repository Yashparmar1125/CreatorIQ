from fastapi import APIRouter, Depends, Request, BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.db import get_db
from app.core.jwt_deps import get_current_user_id, require_internal_token
from app.services.auth_service import AuthService
from app.schemas.auth_schemas import UserCreate, UserLogin, TokenRefresh, OnboardingUpdate


router = APIRouter()
service = AuthService()


@router.get("/auth/health")
async def health() -> dict:
    return service.health()


@router.get("/auth/me")
async def auth_me(
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.me(db, user_id)


@router.post("/auth/register")
async def register(payload: UserCreate, request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    return await service.register(
        db,
        payload,
        ip_address=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/auth/login")
async def login(payload: UserLogin, request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    return await service.login(
        db,
        payload,
        ip_address=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/auth/token/refresh")
async def refresh_token(payload: TokenRefresh, db: AsyncSession = Depends(get_db)) -> dict:
    return await service.refresh_token(db, payload.refresh_token)


@router.get("/auth/google/oauth-url")
@router.get("/auth/google/url")
async def google_oauth_url(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
) -> dict:
    import uuid
    user_id = None
    header_uid = request.headers.get("x-user-id")
    if header_uid:
        try:
            user_id = uuid.UUID(header_uid)
        except Exception:
            pass
    if not user_id and credentials:
        try:
            from app.core.jwt_deps import decode_access_token
            payload = decode_access_token(credentials.credentials)
            user_id = uuid.UUID(payload["sub"])
        except Exception:
            pass
    return service.google_oauth_build_url(user_id=user_id)


@router.get("/auth/google/callback")
async def google_oauth_callback(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    return await service.google_oauth_callback(
        db,
        background_tasks,
        code=code,
        state=state,
        oauth_error=error,
        ip_address=(request.client.host if request.client else None),
        user_agent=request.headers.get("user-agent"),
    )


@router.get("/auth/youtube/oauth-url")
@router.get("/auth/youtube/url")
async def youtube_oauth_url(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
) -> dict:
    user_id = None
    if credentials:
        try:
            from app.core.jwt_deps import decode_access_token
            import uuid
            payload = decode_access_token(credentials.credentials)
            user_id = uuid.UUID(payload["sub"])
        except Exception:
            pass
    return service.google_oauth_build_url(user_id=user_id)


@router.post("/auth/youtube/sync")
async def sync_youtube(
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    """Manually trigger quota-efficient deep YouTube synchronization."""
    return await service.sync_channel(db, user_id)


@router.post("/auth/youtube/disconnect")
@router.delete("/auth/youtube/disconnect")
async def disconnect_youtube(
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    """Revoke YouTube OAuth integration for current user."""
    return await service.disconnect_youtube(db, user_id)


@router.patch("/auth/onboarding/complete")
async def complete_onboarding(
    payload: OnboardingUpdate,
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.complete_onboarding(db, user_id, payload)
