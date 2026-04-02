import uuid
from functools import lru_cache

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

security = HTTPBearer(auto_error=True)


@lru_cache(maxsize=1)
def _public_key_pem() -> str:
    with open(settings.jwt_public_key_path, "r", encoding="utf-8") as f:
        return f.read()


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        _public_key_pem(),
        algorithms=["RS256"],
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
    )


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> uuid.UUID:
    try:
        payload = decode_access_token(credentials.credentials)
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return uuid.UUID(str(sub))
    except (JWTError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": str(e), "details": {}},
        ) from e


from fastapi import Header

async def require_internal_token(
    x_internal_service_token: str = Header(..., alias="X-Internal-Service-Token")
) -> None:
    if x_internal_service_token != settings.internal_service_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Invalid internal service token.", "details": {}},
        )
