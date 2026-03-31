import uuid
from dataclasses import dataclass

from fastapi import Header, HTTPException, status

from app.core.config import settings


@dataclass(frozen=True)
class UserContext:
    user_id: uuid.UUID
    plan_tier: str | None


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
