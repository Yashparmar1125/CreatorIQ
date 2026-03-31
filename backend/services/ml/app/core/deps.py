from fastapi import Header, HTTPException, status

from app.core.config import settings


def require_internal_token(x_internal_service_token: str | None = Header(default=None)) -> None:
    if not x_internal_service_token or x_internal_service_token != settings.internal_service_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_INTERNAL_TOKEN", "message": "Missing/invalid internal service token.", "details": {}},
        )
