import os
import sys

from alembic import context
from sqlalchemy import create_engine, pool

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.base import Base  # noqa: E402
from app.core.config import settings  # noqa: E402
import app.models.strategy_models  # noqa: F401,E402

config = context.config
target_metadata = Base.metadata


def _sync_database_url(database_url: str) -> str:
    if database_url.startswith("postgresql+asyncpg://"):
        return database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return database_url


def _get_database_url() -> str:
    raw_url = os.getenv("DATABASE_URL") or settings.database_url or config.get_main_option("sqlalchemy.url")

    if raw_url.startswith("${") and raw_url.endswith("}"):
        env_key = raw_url[2:-1]
        raw_url = os.getenv(env_key, "")

    if not raw_url:
        raise RuntimeError("DATABASE_URL is not set. Provide it via env or app settings.")

    return _sync_database_url(raw_url)


def run_migrations_offline() -> None:
    url = _get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        version_table=config.get_main_option("version_table"),
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = _get_database_url()
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            version_table=config.get_main_option("version_table"),
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

