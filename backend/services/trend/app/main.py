import asyncio
import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

import app.models.chat_models  # noqa: F401 - Register models
import app.models.concept_models  # noqa: F401 - Register models
import app.models.trend_models  # noqa: F401 - Register models

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import SessionLocal, engine
from app.models.base import Base
from app.services.concept_collector import ConceptCollector

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()
collector = ConceptCollector()


async def _run_scheduled_collection() -> None:
    try:
        async with SessionLocal() as db:
            n = await collector.run_all_clusters(db)
            logger.info("Scheduled concept collection complete: %s signals", n)
    except Exception:
        logger.exception("Scheduled concept collection failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Trend database tables verified/created successfully.")
    except Exception:
        logger.exception("Failed to initialize trend database tables")

    scheduler.add_job(
        _run_scheduled_collection,
        "interval",
        hours=settings.collector_interval_hours,
        id="concept_collector",
        replace_existing=True,
    )
    scheduler.start()
    # Run once on startup so feeds have data quickly
    asyncio.create_task(_run_scheduled_collection())
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="CreatorIQ Trend Service", version="v1", lifespan=lifespan)
app.include_router(api_router)

