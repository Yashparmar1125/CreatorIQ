import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any

from jose import jwt
import bcrypt

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


@lru_cache(maxsize=1)
def _load_private_key_pem() -> str:
    with open(settings.jwt_private_key_path, "r", encoding="utf-8") as f:
        return f.read()


def create_access_token(claims: dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.access_token_ttl_minutes)
    payload = {
        **claims,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, _load_private_key_pem(), algorithm="RS256")


def generate_refresh_token() -> str:
    # Opaque token; only a hash is stored server-side.
    return secrets.token_urlsafe(48)


def hash_refresh_token(refresh_token: str) -> str:
    # Pepper is not stored in DB; helps if DB is leaked.
    h = hashlib.sha256()
    h.update(settings.refresh_token_pepper.encode("utf-8"))
    h.update(b":")
    h.update(refresh_token.encode("utf-8"))
    return h.hexdigest()

