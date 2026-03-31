import json
import uuid

from fastapi import Header, HTTPException, status


def parse_allowed_channel_ids(x_user_channels: str | None = Header(default=None)) -> set[uuid.UUID]:
    if not x_user_channels:
        return set()
    try:
        raw = json.loads(x_user_channels)
        if not isinstance(raw, list):
            return set()
        return {uuid.UUID(str(x)) for x in raw}
    except Exception:
        return set()


def ensure_channel_allowed(allowed: set[uuid.UUID], channel_id: uuid.UUID) -> None:
    if not allowed:
        # Dev / bootstrap: JWT may not include channel IDs until OAuth links a channel.
        return
    if channel_id not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "You do not have access to this channel.", "details": {}},
        )
