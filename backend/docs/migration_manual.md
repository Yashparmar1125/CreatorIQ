# CreatorIQ Centralized Database Migration Manual

This manual provides instructions for developers on how to manage database migrations in the new centralized PostgreSQL architecture.

## Architecture Overview

All microservices now share a single PostgreSQL database named `CreatorIQ`. To prevent migration collisions, each service tracks its own migration history using a unique version table.

| Service | Version Table Name | Root Namespace |
| :--- | :--- | :--- |
| **Auth** | `alembic_version_auth` | `users`, `sessions` |
| **Channel** | `alembic_version_channel` | `channels`, `audience_snapshots` |
| **Trend** | `alembic_version_trend` | `trends`, `trend_metrics` |
| **Strategy** | `alembic_version_strategy` | `strategy_sessions`, `strategy_recommendations` |
| **Analytics** | `alembic_version_analytics` | `channel_metrics`, `video_metrics` |
| **Planner** | `alembic_version_planner` | `content_plans`, `scripts` |

## Standard Workflow

### 1. Unified Configuration
All services load their configuration from the root `backend/.env` file. Do **not** create service-local `.env` files for database settings.

```env
# backend/.env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/CreatorIQ
```

### 2. Running Migrations
Always run migrations from the specific service directory, but ensure the root `.env` is present.

```powershell
# Navigate to service
cd backend/services/auth

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### 3. Creating New Migrations
When creating migrations, Alembic will automatically use the `version_table` specified in that service's `alembic.ini`.

```powershell
alembic revision --autogenerate -m "Add new field to users"
```

> [!IMPORTANT]
> **Namespace Collision Warning**: Since all tables live in the same public schema, you MUST prefix your table names or ensure they are unique across the entire ecosystem. Check the [Master Schema](master_schema.md) before naming new tables.

## Troubleshooting

### "Relation 'alembic_version' already exists"
This happens if a service's `alembic.ini` is missing the `version_table` setting or if `env.py` is not using it.
**Fix**: Ensure `alembic.ini` has `version_table = alembic_version_<service>` and `env.py` passes `version_table=config.get_main_option("version_table")` to `context.configure()`.

### "Table 'XYZ' already exists"
Another service has already claimed this table name.
**Fix**: Rename your table to be more specific (e.g., from `tasks` to `planner_tasks`).
