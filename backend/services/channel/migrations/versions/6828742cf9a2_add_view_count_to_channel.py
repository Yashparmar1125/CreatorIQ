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


def upgrade() -> None:
    op.add_column('channels', sa.Column('view_count', sa.BigInteger(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('channels', 'view_count')

