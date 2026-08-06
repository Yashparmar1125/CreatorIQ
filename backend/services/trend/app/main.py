import asyncio
import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import SessionLocal
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
