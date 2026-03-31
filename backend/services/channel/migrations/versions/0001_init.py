"""init

Revision ID: 0001_init
Revises:
Create Date: 2026-03-30
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tables from SQLAlchemy metadata for v1 scaffolding.
    from app.models.base import Base
    import app.models.channel_models  # noqa: F401

    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    from app.models.base import Base
    import app.models.channel_models  # noqa: F401

    Base.metadata.drop_all(bind=op.get_bind())

