from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.api.v1.router import api_router
from app.worker import sync_youtube_analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = AsyncIOScheduler()
    # Run every 12 hours
    scheduler.add_job(sync_youtube_analytics, "interval", hours=12)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="CreatorIQ Analytics Service", version="v1", lifespan=lifespan)
app.include_router(api_router)
