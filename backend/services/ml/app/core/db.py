import logging
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

logger = logging.getLogger(__name__)

engine = None
SessionLocal = None

try:
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
except Exception as exc:
    logger.warning("Could not initialize ML database engine: %s", exc)


async def get_db() -> AsyncGenerator[AsyncSession | None, None]:
    if SessionLocal is None:
        yield None
        return
    try:
        async with SessionLocal() as session:
            yield session
    except Exception as exc:
        logger.warning("DB session error in ML service: %s", exc)
        yield None
