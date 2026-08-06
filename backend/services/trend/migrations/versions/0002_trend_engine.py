"""Trend Engine v1 — concept store, signals, feed snapshots, credits

Revision ID: 0002_trend_engine
Revises: 0001_init
Create Date: 2026-08-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_trend_engine"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    concept_lifecycle = postgresql.ENUM(
        "emerging", "growing", "peaking", "declining", "expired",
        name="concept_lifecycle",
        create_type=False,
    )
    concept_signal_source = postgresql.ENUM(
        "youtube_search", "youtube_video", "google_trends", "news",
        name="concept_signal_source",
        create_type=False,
    )

    bind = op.get_bind()
    concept_lifecycle.create(bind, checkfirst=True)
    concept_signal_source.create(bind, checkfirst=True)

    op.create_table(
        "trend_concepts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("canonical_title", sa.String(500), nullable=False),
        sa.Column("title_slug", sa.String(500), nullable=False, unique=True),
        sa.Column("aliases", postgresql.ARRAY(sa.String(256)), nullable=False, server_default="{}"),
        sa.Column("niche_tags", postgresql.ARRAY(sa.String(64)), nullable=False, server_default="{}"),
        sa.Column("geo_strength", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("lifecycle", concept_lifecycle, nullable=False, server_default="emerging"),
        sa.Column("raw_momentum", sa.Numeric(6, 3), nullable=False, server_default="0"),
        sa.Column("youtube_video_velocity", sa.Numeric(6, 3), nullable=False, server_default="0"),
        sa.Column("youtube_search_velocity", sa.Numeric(6, 3), nullable=False, server_default="0"),
        sa.Column("google_trends_growth", sa.Numeric(6, 3), nullable=False, server_default="0"),
        sa.Column("search_volume_est", sa.INTEGER, nullable=False, server_default="0"),
        sa.Column("why_trending", sa.Text, nullable=True),
        sa.Column("key_indicator", sa.String(256), nullable=True),
        sa.Column("sources", postgresql.ARRAY(sa.String(32)), nullable=False, server_default="{}"),
        sa.Column("first_seen_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_signal_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_trend_concepts_title_slug", "trend_concepts", ["title_slug"])

    op.create_table(
        "concept_signals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("concept_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("source", concept_signal_source, nullable=False),
        sa.Column("payload", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("captured_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "trend_feed_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("items", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("concept_ids", postgresql.ARRAY(sa.String(64)), nullable=False, server_default="{}"),
        sa.Column("credits_used", sa.INTEGER, nullable=False, server_default="0"),
        sa.Column("is_first_feed", sa.BOOLEAN, nullable=False, server_default="false"),
        sa.Column("geo_source", sa.String(32), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "user_feed_credits",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("credits_used", sa.INTEGER, nullable=False, server_default="0"),
        sa.Column("period_start", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("user_feed_credits")
    op.drop_table("trend_feed_snapshots")
    op.drop_table("concept_signals")
    op.drop_index("ix_trend_concepts_title_slug", table_name="trend_concepts")
    op.drop_table("trend_concepts")

    bind = op.get_bind()
    sa.Enum(name="concept_signal_source").drop(bind, checkfirst=True)
    sa.Enum(name="concept_lifecycle").drop(bind, checkfirst=True)
