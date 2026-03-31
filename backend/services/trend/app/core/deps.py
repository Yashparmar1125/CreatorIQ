import uuid
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status

from app.core.config import settings


@dataclass(frozen=True)
class UserContext:
    user_id: uuid.UUID
    plan_tier: str | None


def require_internal_token(x_internal_service_token: str | None = Header(default=None)) -> None:
    if not x_internal_service_token or x_internal_service_token != settings.internal_service_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_INTERNAL_TOKEN", "message": "Missing/invalid internal service token.", "details": {}},
        )


def get_user_context(
    x_user_id: str | None = Header(default=None),
    x_plan_tier: str | None = Header(default=None),
) -> UserContext:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "MISSING_IDENTITY", "message": "Missing user identity (gateway headers).", "details": {}},
        )
    try:
        uid = uuid.UUID(x_user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "BAD_IDENTITY", "message": "Invalid user identity.", "details": {}},
        ) from e
    return UserContext(user_id=uid, plan_tier=x_plan_tier)
