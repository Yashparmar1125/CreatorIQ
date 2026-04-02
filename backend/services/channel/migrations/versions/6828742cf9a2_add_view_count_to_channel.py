"""add_view_count_to_channel

Revision ID: 6828742cf9a2
Revises: 0001_init
Create Date: 2026-03-31 11:16:08.922442
"""

from alembic import op
import sqlalchemy as sa


revision = '6828742cf9a2'
down_revision = '0001_init'
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    if not _column_exists("channels", "view_count"):
        op.add_column("channels", sa.Column("view_count", sa.BigInteger(), nullable=False, server_default="0"))


def downgrade() -> None:
    if _column_exists("channels", "view_count"):
        op.drop_column("channels", "view_count")

