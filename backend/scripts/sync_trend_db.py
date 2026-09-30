import asyncio
import os
import sys
from pathlib import Path

# Add services to sys.path
backend_dir = Path(__file__).resolve().parent.parent
services_dir = backend_dir / "services"

sys.path.insert(0, str(services_dir / "auth"))
sys.path.insert(0, str(services_dir / "channel"))
sys.path.insert(0, str(services_dir / "trend"))
sys.path.insert(0, str(services_dir / "ml"))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import DeclarativeBase

# Connect to local postgres container
DB_URL = "postgresql+asyncpg://creatoriq:creatoriq@localhost:5432/creatoriq"

async def main():
    engine = create_async_engine(DB_URL, echo=True)

    print("--- Loading all model definitions ---")
    # Trend models
    import app.models.concept_models as concept_models
    import app.models.trend_models as trend_models
    from app.models.base import Base as TrendBase

    # Channel models
    import channel_service_models if False else None
    
    # Let's create all tables registered on TrendBase metadata
    async with engine.begin() as conn:
        print("Creating trend tables...")
        await conn.run_sync(TrendBase.metadata.create_all)

    print("Trend tables synced successfully!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
