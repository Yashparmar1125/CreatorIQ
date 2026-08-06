"""Add audience_geo_weights to channels

Revision ID: 0003_channel_audience_geo
Revises: 0002_creator_profiles
Create Date: 2026-08-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_channel_audience_geo"
down_revision = "0002_creator_profiles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "channels",
        sa.Column("audience_geo_weights", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("channels", "audience_geo_weights")
