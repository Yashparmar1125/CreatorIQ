import asyncio
import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine

# Add current dir to path
sys.path.append(os.getcwd())

from app.models.base import Base
import app.models.trend_models

DATABASE_URL = "postgresql+asyncpg://postgres:1125@localhost:5432/CreatorIQ"

async def create_tables():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("[+] Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(create_tables())
