import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def test_conn(password):
    url = f"postgresql+asyncpg://postgres:1125@localhost:5432/CreatorIQ"
    engine = create_async_engine(url)
    try:
        async with engine.connect() as conn:
            print(f"SUCCESS with password: {password}")
            return True
    except Exception:
        return False
    finally:
        await engine.dispose()

async def main():
    passwords = ["creatoriq", "postgres", "admin", "password", "123456"]
    for p in passwords:
        print(f"Trying password: {p}")
        if await test_conn(p):
            break
    else:
        print("All attempts failed.")

if __name__ == "__main__":
    asyncio.run(main())
