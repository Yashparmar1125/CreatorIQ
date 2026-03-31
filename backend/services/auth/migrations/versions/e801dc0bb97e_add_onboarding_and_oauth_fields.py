# revision identifiers, used by Alembic.
revision = "e801dc0bb97e"
down_revision = "0001_init"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    # Add onboarding fields to users table
    op.add_column('users', sa.Column('niche', postgresql.ARRAY(sa.String()), nullable=True))
    op.add_column('users', sa.Column('primary_format', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('posting_frequency', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('channel_tone', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('country', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove onboarding fields from users table
    op.drop_column('users', 'country')
    op.drop_column('users', 'channel_tone')
    op.drop_column('users', 'posting_frequency')
    op.drop_column('users', 'primary_format')
    op.drop_column('users', 'niche')

