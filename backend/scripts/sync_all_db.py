import asyncio
import sys
import importlib
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine

DB_URL = "postgresql+asyncpg://creatoriq:creatoriq@localhost:5432/creatoriq"
backend_dir = Path(__file__).resolve().parent.parent / "services"

async def sync_service(service_name: str, model_modules: list[str]):
    print(f"\n================ Syncing {service_name} ================")
    service_path = str(backend_dir / service_name)
    sys.path.insert(0, service_path)

    # Purge any previously cached 'app' modules
    for mod in list(sys.modules.keys()):
        if mod == "app" or mod.startswith("app."):
            del sys.modules[mod]

    engine = create_async_engine(DB_URL, echo=False)
    
    base_mod = importlib.import_module("app.models.base")
    Base = getattr(base_mod, "Base")

    for mod_name in model_modules:
        importlib.import_module(mod_name)
        print(f"Loaded {mod_name}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print(f"Created tables for {service_name}: {list(Base.metadata.tables.keys())}")
    await engine.dispose()
    sys.path.remove(service_path)

async def main():
    await sync_service("auth", ["app.models.auth_models"])
    await sync_service("channel", ["app.models.channel_models", "app.models.creator_profile_models"])
    await sync_service("trend", ["app.models.trend_models", "app.models.concept_models"])
    await sync_service("ml", ["app.models.ml_models"])
    print("\n>>> ALL DATABASE TABLES SUCCESSFULLY CREATED AND SYNCED! <<<")

if __name__ == "__main__":
    asyncio.run(main())
