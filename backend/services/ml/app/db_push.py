import asyncio
import logging

from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.models.base import Base
import app.models.ml_models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def push_schema() -> None:
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("[db-push] %s: schema synced", settings.service_name)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(push_schema())
