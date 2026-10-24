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

from pydantic import BaseModel


class CalendarEventCreateBody(BaseModel):
    title: str
    start_iso: str
    duration_minutes: int = 60
    description: str = ""


@router.get("/auth/calendar/oauth-url")
async def calendar_oauth_url(
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
    return service.google_oauth_build_url(user_id=user_id, connector="calendar")


@router.get("/auth/calendar/status")
async def calendar_status(
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.get_calendar_status(db, user_id)


@router.post("/auth/calendar/disconnect")
@router.delete("/auth/calendar/disconnect")
async def disconnect_calendar(
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.disconnect_calendar(db, user_id)


@router.get("/auth/calendar/events")
async def list_calendar_events(
    days_ahead: int = 14,
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.list_calendar_events(db, user_id, days_ahead=days_ahead)


@router.post("/auth/calendar/events")
async def create_calendar_event(
    body: CalendarEventCreateBody,
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.create_calendar_event(
        db,
        user_id,
        title=body.title,
        start_iso=body.start_iso,
        duration_minutes=body.duration_minutes,
        description=body.description,
    )


@router.get("/internal/auth/calendar/{user_id}/events")
async def internal_list_calendar_events(
    user_id: str,
    days_ahead: int = 14,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    import uuid
    return await service.list_calendar_events(db, uuid.UUID(user_id), days_ahead=days_ahead)


@router.post("/internal/auth/calendar/{user_id}/events")
async def internal_create_calendar_event(
    user_id: str,
    body: CalendarEventCreateBody,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    import uuid
    return await service.create_calendar_event(
        db,
        uuid.UUID(user_id),
        title=body.title,
        start_iso=body.start_iso,
        duration_minutes=body.duration_minutes,
        description=body.description,
    )


class NotionConnectBody(BaseModel):
    token: str


class VaultExportBody(BaseModel):
    title: str
    content: str
    destination: str = "auto"


@router.get("/auth/drive/oauth-url")
async def drive_oauth_url(
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
    return service.google_oauth_build_url(user_id=user_id, connector="drive")


@router.get("/auth/drive/status")
async def drive_status(
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.get_drive_status(db, user_id)


@router.post("/auth/drive/disconnect")
@router.delete("/auth/drive/disconnect")
async def disconnect_drive(
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.disconnect_drive(db, user_id)


@router.get("/auth/notion/status")
async def notion_status(
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.get_notion_status(db, user_id)


@router.post("/auth/notion/connect")
async def connect_notion(
    body: NotionConnectBody,
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.connect_notion_token(db, user_id, token_str=body.token)


@router.post("/auth/notion/disconnect")
@router.delete("/auth/notion/disconnect")
async def disconnect_notion(
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.disconnect_notion(db, user_id)


@router.get("/auth/vault/search")
async def search_vault(
    query: str = "",
    max_results: int = 6,
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.search_knowledge_vault(db, user_id, query=query, max_results=max_results)


@router.post("/auth/vault/export")
async def export_vault(
    body: VaultExportBody,
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.export_to_knowledge_vault(
        db,
        user_id,
        title=body.title,
        content=body.content,
        destination=body.destination,
    )


@router.get("/internal/auth/vault/{user_id}/search")
async def internal_search_vault(
    user_id: str,
    query: str = "",
    max_results: int = 6,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    import uuid
    return await service.search_knowledge_vault(db, uuid.UUID(user_id), query=query, max_results=max_results)


@router.post("/internal/auth/vault/{user_id}/export")
async def internal_export_vault(
    user_id: str,
    body: VaultExportBody,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_internal_token),
) -> dict:
    import uuid
    return await service.export_to_knowledge_vault(
        db,
        uuid.UUID(user_id),
        title=body.title,
        content=body.content,
        destination=body.destination,
    )
