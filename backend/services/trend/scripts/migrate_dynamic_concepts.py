"""
Database Migration Script: Adds dynamic trend discovery fields and concept_candidates table.
"""

import asyncio
import logging
from sqlalchemy import text

from app.core.db import engine
from app.models.base import Base
import app.models.concept_models  # noqa: F401

logger = logging.getLogger(__name__)


async def migrate():
    print("[*] Running dynamic concept migration...")
    async with engine.begin() as conn:
        # 1. Add columns to concepts table if they do not exist
        print("[*] Ensuring columns exist on `concepts` table...")
        await conn.execute(
            text("ALTER TABLE concepts ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT FALSE;")
        )
        await conn.execute(
            text("ALTER TABLE concepts ADD COLUMN IF NOT EXISTS discovery_source VARCHAR(50) DEFAULT 'yaml_seed';")
        )
        await conn.execute(
            text("ALTER TABLE concepts ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 1.0;")
        )
        await conn.execute(
            text("ALTER TABLE concepts ADD COLUMN IF NOT EXISTS last_decay_check TIMESTAMPTZ DEFAULT NOW();")
        )

        # 2. Create concept_candidates table if not exists via Base metadata
        print("[*] Ensuring `concept_candidates` table exists...")
        await conn.run_sync(Base.metadata.create_all)

    print("[+] Migration completed successfully!")


if __name__ == "__main__":
    asyncio.run(migrate())
