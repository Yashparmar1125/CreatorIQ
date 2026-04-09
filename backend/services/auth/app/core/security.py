import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any

from jose import jwt
import bcrypt
from cryptography.fernet import Fernet

from app.core.config import settings

logger = logging.getLogger(__name__)


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


@lru_cache(maxsize=1)
def _get_fernet_cipher() -> Fernet:
    if not settings.aes_encryption_key:
        raise ValueError("aes_encryption_key is missing in settings")
    return Fernet(settings.aes_encryption_key.encode("utf-8"))


def encrypt_token(token: str) -> str:
    if not token:
        return ""
    cipher = _get_fernet_cipher()
    return cipher.encrypt(token.encode("utf-8")).decode("utf-8")


def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token:
        return ""
    
    # If it doesn't look like a Fernet token (starts with gAAAAA), it might be old plaintext
    if not encrypted_token.startswith("gAAAAA"):
        return encrypted_token
        
    cipher = _get_fernet_cipher()
    try:
        return cipher.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
    except Exception as e:
        logger.error(f"Decryption failed: {str(e)}")
        # If decryption fails, do NOT return the encrypted garbage. 
        # Return empty or raise so the caller knows the key is invalid.
        return ""

