import asyncio
from sqlalchemy import inspect
from app.core.db import engine

async def check():
    async with engine.connect() as conn:
        def get_columns(sync_conn):
            return [col['name'] for col in inspect(sync_conn).get_columns('oauth_tokens')]
        columns = await conn.run_sync(get_columns)
        print(f"Columns: {columns}")

if __name__ == "__main__":
    asyncio.run(check())
