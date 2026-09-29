import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.config import settings
from app.core.db import engine
from app.models.base import Base
import app.models.channel_models  # noqa: F401
import app.models.creator_profile_models  # noqa: F401
from app.api.v1.router import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[Channel] Database schema initialized successfully.")
    except Exception as e:
        logger.warning(f"[Channel] Schema auto-sync warning: {e}")
    yield


app = FastAPI(title="CreatorIQ Channel Service", version="v1", lifespan=lifespan)
app.include_router(api_router)
