"""
Purge all synthetic 'yt_%' garbage data from PostgreSQL and hydrate canonical concepts
with 100% genuine YouTube Data API v3 videos using the 3-key pool (max 270 queries/day limit).
"""

import asyncio
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Setup paths so app modules import properly
backend_dir = Path(__file__).resolve().parent.parent
services_dir = backend_dir / "services"
trend_dir = services_dir / "trend"

sys.path.insert(0, str(trend_dir))
sys.path.insert(0, "/app")

from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.youtube_router import youtube_router, MAX_DAILY_SEARCH_QUERIES
from app.models.concept_models import Concept, ConceptDailySignal, ConceptSignal
from app.models.trend_models import TrendConcept, TrendFeedSnapshot
from app.services.pipeline_engine import PipelineEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hydrate_real_youtube")


async def main() -> None:
    logger.info("=================================================================")
    logger.info("STARTING DATABASE GARBAGE PURGE & REAL YOUTUBE HYDRATION")
    logger.info("=================================================================")

    # 1. Connect to database
    db_url = os.environ.get("DATABASE_URL") or settings.database_url
    logger.info("Connecting to database: %s", db_url.split("@")[-1] if "@" in db_url else db_url)
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 2. Purge synthetic dummy data
        logger.info("--- Step 1: Purging all synthetic 'yt_%%' records from DB ---")
        
        del_cds = await session.execute(
            text("DELETE FROM concept_daily_signals WHERE top_outlier_video_id LIKE 'yt_%' OR population::text LIKE '%yt_%';")
        )
        del_cs = await session.execute(
            text("DELETE FROM concept_signals WHERE payload::text LIKE '%yt_%';")
        )
        del_tfs = await session.execute(
            text("DELETE FROM trend_feed_snapshots WHERE items::text LIKE '%yt_%';")
        )
        await session.commit()

        logger.info(
            "Purged dummy records: %d from concept_daily_signals, %d from concept_signals, %d from trend_feed_snapshots.",
            del_cds.rowcount,
            del_cs.rowcount,
            del_tfs.rowcount,
        )

        # 3. Fetch active concepts
        logger.info("--- Step 2: Fetching canonical concepts to hydrate ---")
        res = await session.execute(select(Concept).where(Concept.active == True).order_by(Concept.name))
        concepts = list(res.scalars().all())
        logger.info("Found %d active canonical concepts to hydrate.", len(concepts))

        if len(concepts) > MAX_DAILY_SEARCH_QUERIES:
            logger.warning("Active concepts count (%d) exceeds daily search query limit (%d). Truncating.", len(concepts), MAX_DAILY_SEARCH_QUERIES)
            concepts = concepts[:MAX_DAILY_SEARCH_QUERIES]

        pipeline = PipelineEngine()
        today = datetime.now(timezone.utc).date()
        successful_hydrations = 0
        total_real_videos = 0

        logger.info("--- Step 3: Executing genuine YouTube searches via 3-key pool router ---")
        logger.info("Daily Quota Limit: %d search queries/day. Multi-key pool loaded with %d keys.", MAX_DAILY_SEARCH_QUERIES, len(youtube_router._keys))

        for idx, concept in enumerate(concepts, 1):
            logger.info("[%d/%d] Hydrating concept: '%s' (%s)", idx, len(concepts), concept.name, concept.category)
            try:
                run_res = await pipeline.execute_concept_run(session, concept, today)
                pop_size = run_res.get("population_size", 0)
                status = run_res.get("status", "unknown")

                if pop_size > 0:
                    successful_hydrations += 1
                    total_real_videos += pop_size
                    logger.info("   -> SUCCESS: %d real YouTube videos verified and saved for '%s'.", pop_size, concept.name)
                else:
                    logger.warning("   -> Run completed with 0 population (%s) for '%s'.", status, concept.name)

                await session.commit()
            except Exception as e:
                logger.error("   -> ERROR during hydration of '%s': %s", concept.name, e)
                await session.rollback()

        logger.info("=================================================================")
        logger.info("HYDRATION COMPLETED SUMMARY:")
        logger.info("Concepts successfully hydrated with real YouTube videos: %d / %d", successful_hydrations, len(concepts))
        logger.info("Total real YouTube videos verified & persisted: %d", total_real_videos)
        logger.info("YouTube search queries used today: %d / %d limit", youtube_router.get_daily_searches_used(), MAX_DAILY_SEARCH_QUERIES)
        logger.info("=================================================================")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
