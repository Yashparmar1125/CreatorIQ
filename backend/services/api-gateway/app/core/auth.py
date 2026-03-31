import json
from functools import lru_cache
from typing import Any

from fastapi import HTTPException, Request, status
from jose import JWTError, jwt

from app.core.config import settings


@lru_cache(maxsize=1)
def _load_public_key_pem() -> str:
    with open(settings.jwt_public_key_path, "r", encoding="utf-8") as f:
        return f.read()


def verify_bearer_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            _load_public_key_pem(),
            algorithms=["RS256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Invalid or expired token.", "details": {"reason": str(e)}},
        ) from e


def get_bearer_token_from_request(request: Request) -> str:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "MISSING_AUTH", "message": "Missing Authorization header.", "details": {}},
        )
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "BAD_AUTH", "message": "Authorization must be Bearer token.", "details": {}},
        )
    return parts[1]


def build_trusted_user_headers(claims: dict[str, Any]) -> dict[str, str]:
    sub = claims.get("sub")
    email = claims.get("email")
    plan_tier = claims.get("plan_tier")
    channels = claims.get("channels")
    headers: dict[str, str] = {}
    if sub:
        headers["X-User-Id"] = str(sub)
    if email:
        headers["X-User-Email"] = str(email)
    if plan_tier:
        headers["X-Plan-Tier"] = str(plan_tier)
    if channels is not None:
        headers["X-User-Channels"] = json.dumps(channels)
    return headers

