import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def test_conn():
    # Use the URL from the updated .env
    url = "postgresql+asyncpg://postgres:1125@localhost:5432/CreatorIQ"
    engine = create_async_engine(url)
    try:
        async with engine.connect() as conn:
            print("Successfully connected to Postgres with user postgres:1125!")
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_conn())
