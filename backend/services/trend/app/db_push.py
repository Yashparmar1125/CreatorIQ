"""Sync SQLAlchemy models to the database (no Alembic history)."""

from __future__ import annotations

import asyncio

from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.models.base import Base

import app.models.trend_models  # noqa: F401
import app.models.concept_models  # noqa: F401


async def push_schema() -> None:
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set")
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print(f"[db-push] {settings.service_name}: schema synced")


def main() -> None:
    asyncio.run(push_schema())


if __name__ == "__main__":
    main()
