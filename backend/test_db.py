import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def test_conn():
    # Use localhost instead of 'postgres' for host-side access
    url = "postgresql+asyncpg://creatoriq:creatoriq@localhost:5432/creatoriq"
    engine = create_async_engine(url)
    try:
        async with engine.connect() as conn:
            print("Successfully connected to Postgres!")
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_conn())
