"""creator_profiles table

Revision ID: 0002_creator_profiles
Revises: 7a422012184a
Create Date: 2026-03-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_creator_profiles"
down_revision = "7a422012184a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    profile_maturity = postgresql.ENUM(
        "new", "emerging", "established", name="profile_maturity", create_type=False
    )
    niche_source = postgresql.ENUM(
        "onboarding", "blended", "channel_primary", name="niche_source", create_type=False
    )
    profile_mode = postgresql.ENUM("manual", "analysis_assisted", name="profile_mode", create_type=False)
    geo_source = postgresql.ENUM(
        "youtube_analytics", "onboarding_country", "global_default", name="geo_source", create_type=False
    )
    creator_sync_status = postgresql.ENUM(
        "pending",
        "essential_complete",
        "analysis_complete",
        "analysis_limited",
        name="creator_sync_status",
        create_type=False,
    )

    profile_maturity.create(op.get_bind(), checkfirst=True)
    niche_source.create(op.get_bind(), checkfirst=True)
    profile_mode.create(op.get_bind(), checkfirst=True)
    geo_source.create(op.get_bind(), checkfirst=True)
    creator_sync_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "creator_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("channel_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("profile_maturity", profile_maturity, nullable=False, server_default="new"),
        sa.Column("analysis_confidence", sa.Numeric(4, 3), nullable=False, server_default="0.3"),
        sa.Column("profile_mode", profile_mode, nullable=False, server_default="manual"),
        sa.Column("niches_onboarding", postgresql.ARRAY(sa.String(64)), nullable=False, server_default="{}"),
        sa.Column("niches_inferred", postgresql.ARRAY(sa.String(64)), nullable=False, server_default="{}"),
        sa.Column("niches_effective", postgresql.ARRAY(sa.String(64)), nullable=False, server_default="{}"),
        sa.Column("niche_source", niche_source, nullable=False, server_default="onboarding"),
        sa.Column("content_format", sa.String(32), nullable=False, server_default="both"),
        sa.Column("posting_frequency", sa.String(50), nullable=True),
        sa.Column("tone", sa.String(32), nullable=False, server_default="mixed"),
        sa.Column("geo_source", geo_source, nullable=False, server_default="onboarding_country"),
        sa.Column("geo_target_country", sa.String(100), nullable=True),
        sa.Column("audience_geo_weights", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("channel_stats", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("sync_status", creator_sync_status, nullable=False, server_default="pending"),
        sa.Column("last_analyzed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("last_reconfigured_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("onboarding_completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_creator_profiles_user_id", "creator_profiles", ["user_id"])


def downgrade() -> None:
    op.drop_table("creator_profiles")
    postgresql.ENUM(name="creator_sync_status").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="geo_source").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="profile_mode").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="niche_source").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="profile_maturity").drop(op.get_bind(), checkfirst=True)
