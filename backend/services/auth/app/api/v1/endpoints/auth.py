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


# Request models removed in favor of app.schemas.auth_schemas


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


@router.patch("/auth/onboarding/complete")
async def complete_onboarding(
    payload: OnboardingUpdate,
    db: AsyncSession = Depends(get_db),
    user_id=Depends(get_current_user_id),
) -> dict:
    return await service.complete_onboarding(db, user_id, payload)
