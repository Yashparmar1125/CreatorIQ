"""add_engagement_rate_to_channel

Revision ID: 7a422012184a
Revises: 6828742cf9a2
Create Date: 2026-03-31 11:22:12.224825
"""

from alembic import op
import sqlalchemy as sa


revision = '7a422012184a'
down_revision = '6828742cf9a2'
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    if not _column_exists("channels", "engagement_rate"):
        op.add_column("channels", sa.Column("engagement_rate", sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade() -> None:
    if _column_exists("channels", "engagement_rate"):
        op.drop_column("channels", "engagement_rate")

