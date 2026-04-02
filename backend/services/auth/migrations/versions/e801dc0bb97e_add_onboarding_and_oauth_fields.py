# revision identifiers, used by Alembic.
revision = "e801dc0bb97e"
down_revision = "0001_init"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def _get_existing_columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {col["name"] for col in inspector.get_columns(table_name)}


def upgrade() -> None:
    existing_columns = _get_existing_columns("users")

    # Add onboarding fields to users table
    if "niche" not in existing_columns:
        op.add_column("users", sa.Column("niche", postgresql.ARRAY(sa.String()), nullable=True))
    if "primary_format" not in existing_columns:
        op.add_column("users", sa.Column("primary_format", sa.String(length=50), nullable=True))
    if "posting_frequency" not in existing_columns:
        op.add_column("users", sa.Column("posting_frequency", sa.String(length=50), nullable=True))
    if "channel_tone" not in existing_columns:
        op.add_column("users", sa.Column("channel_tone", sa.String(length=50), nullable=True))
    if "country" not in existing_columns:
        op.add_column("users", sa.Column("country", sa.String(length=100), nullable=True))


def downgrade() -> None:
    existing_columns = _get_existing_columns("users")

    # Remove onboarding fields from users table
    if "country" in existing_columns:
        op.drop_column("users", "country")
    if "channel_tone" in existing_columns:
        op.drop_column("users", "channel_tone")
    if "posting_frequency" in existing_columns:
        op.drop_column("users", "posting_frequency")
    if "primary_format" in existing_columns:
        op.drop_column("users", "primary_format")
    if "niche" in existing_columns:
        op.drop_column("users", "niche")

