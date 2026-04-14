"""add provider_channel_id to oauth_tokens

Revision ID: add_provider_channel_id
Revises: e801dc0bb97e
Create Date: 2026-04-14
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_provider_channel_id"
down_revision = "e801dc0bb97e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add provider_channel_id to oauth_tokens table
    op.add_column("oauth_tokens", sa.Column("provider_channel_id", sa.String(length=255), nullable=True))


def downgrade() -> None:
    # Remove provider_channel_id from oauth_tokens table
    op.drop_column("oauth_tokens", "provider_channel_id")
