-- CreatorIQ Unified Database Schema

-- Enums
DO $$ BEGIN
    CREATE TYPE trend_status AS ENUM ('emerging', 'peaking', 'peaked', 'declining');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trend_sentiment AS ENUM ('positive', 'neutral', 'negative', 'mixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE supported_format AS ENUM ('long_form', 'shorts', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE signal_source AS ENUM ('google_trends', 'youtube_data', 'cross_platform');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE concept_lifecycle AS ENUM ('emerging', 'growing', 'peaking', 'declining', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE concept_signal_source AS ENUM ('youtube_search', 'youtube_video', 'google_trends', 'news');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_content_format AS ENUM ('long_form', 'shorts', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_tone AS ENUM ('educational', 'entertaining', 'authoritative', 'conversational', 'mixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_metric_period AS ENUM ('day', 'week', 'month');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE profile_maturity AS ENUM ('new', 'emerging', 'established');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE niche_source AS ENUM ('onboarding', 'blended', 'channel_primary');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE profile_mode AS ENUM ('manual', 'analysis_assisted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE geo_source AS ENUM ('youtube_analytics', 'onboarding_country', 'global_default');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE creator_sync_status AS ENUM ('pending', 'essential_complete', 'analysis_complete', 'analysis_limited');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Auth Tables (if not exist)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(32) NOT NULL DEFAULT 'creator',
    tier VARCHAR(32) NOT NULL DEFAULT 'free',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent VARCHAR(500),
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Channel Tables
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    youtube_channel_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    handle VARCHAR(100),
    thumbnail_url TEXT,
    subscriber_count BIGINT NOT NULL DEFAULT 0,
    view_count BIGINT NOT NULL DEFAULT 0,
    engagement_rate NUMERIC(10, 2),
    video_count INTEGER NOT NULL DEFAULT 0,
    niches VARCHAR(64)[] NOT NULL DEFAULT '{}',
    content_formats channel_content_format[] NOT NULL DEFAULT '{}',
    tone channel_tone NOT NULL DEFAULT 'mixed',
    audience_geo_weights JSONB,
    metrics_last_refreshed TIMESTAMPTZ,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS channel_metrics (
    id UUID PRIMARY KEY,
    channel_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    period channel_metric_period NOT NULL,
    views BIGINT NOT NULL,
    watch_time_minutes BIGINT NOT NULL,
    subscribers_gained INTEGER NOT NULL,
    subscribers_lost INTEGER NOT NULL,
    estimated_revenue_usd NUMERIC(12, 4),
    avg_view_duration_secs INTEGER,
    avg_ctr NUMERIC(5, 4),
    impressions BIGINT
);

CREATE TABLE IF NOT EXISTS audience_snapshots (
    id UUID PRIMARY KEY,
    channel_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_profiles (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    channel_id UUID,
    profile_maturity profile_maturity NOT NULL DEFAULT 'new',
    analysis_confidence NUMERIC(4, 3) NOT NULL DEFAULT 0.3,
    profile_mode profile_mode NOT NULL DEFAULT 'manual',
    niches_onboarding VARCHAR(64)[] NOT NULL DEFAULT '{}',
    niches_inferred VARCHAR(64)[] NOT NULL DEFAULT '{}',
    niches_effective VARCHAR(64)[] NOT NULL DEFAULT '{}',
    niche_source niche_source NOT NULL DEFAULT 'onboarding',
    content_format VARCHAR(32) NOT NULL DEFAULT 'both',
    posting_frequency VARCHAR(50),
    tone VARCHAR(32) NOT NULL DEFAULT 'mixed',
    geo_source geo_source NOT NULL DEFAULT 'onboarding_country',
    geo_target_country VARCHAR(100),
    audience_geo_weights JSONB NOT NULL DEFAULT '{}',
    channel_stats JSONB NOT NULL DEFAULT '{}',
    sync_status creator_sync_status NOT NULL DEFAULT 'pending',
    last_analyzed_at TIMESTAMPTZ,
    last_reconfigured_at TIMESTAMPTZ,
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trend Engine Tables
CREATE TABLE IF NOT EXISTS trend_concepts (
    id UUID PRIMARY KEY,
    canonical_title VARCHAR(500) NOT NULL,
    title_slug VARCHAR(500) UNIQUE NOT NULL,
    aliases VARCHAR(256)[] NOT NULL DEFAULT '{}',
    niche_tags VARCHAR(64)[] NOT NULL DEFAULT '{}',
    geo_strength JSONB NOT NULL DEFAULT '{}',
    lifecycle concept_lifecycle NOT NULL DEFAULT 'emerging',
    raw_momentum NUMERIC(6, 3) NOT NULL DEFAULT 0,
    youtube_video_velocity NUMERIC(6, 3) NOT NULL DEFAULT 0,
    youtube_search_velocity NUMERIC(6, 3) NOT NULL DEFAULT 0,
    google_trends_growth NUMERIC(6, 3) NOT NULL DEFAULT 0,
    search_volume_est INTEGER NOT NULL DEFAULT 0,
    why_trending TEXT,
    key_indicator VARCHAR(256),
    sources VARCHAR(32)[] NOT NULL DEFAULT '{}',
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_signal_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS concept_signals (
    id UUID PRIMARY KEY,
    concept_id UUID NOT NULL,
    source concept_signal_source NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trend_feed_snapshots (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    concept_ids VARCHAR(64)[] NOT NULL DEFAULT '{}',
    credits_used INTEGER NOT NULL DEFAULT 0,
    is_first_feed BOOLEAN NOT NULL DEFAULT false,
    geo_source VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_feed_credits (
    user_id UUID PRIMARY KEY,
    credits_used INTEGER NOT NULL DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trends (
    id UUID PRIMARY KEY,
    topic VARCHAR(500) NOT NULL,
    topic_slug VARCHAR(500) UNIQUE NOT NULL,
    niches VARCHAR(64)[] NOT NULL,
    tvs_score NUMERIC(5, 2) NOT NULL,
    prediction_confidence NUMERIC(4, 3) NOT NULL,
    peak_window_start DATE NOT NULL,
    peak_window_end DATE NOT NULL,
    status trend_status NOT NULL,
    sentiment trend_sentiment NOT NULL DEFAULT 'neutral',
    supported_formats supported_format[] NOT NULL,
    top_keywords TEXT[] NOT NULL,
    description TEXT,
    data_sources VARCHAR(64)[] NOT NULL,
    scored_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trend_signals (
    id UUID PRIMARY KEY,
    trend_id UUID NOT NULL,
    signal_source signal_source NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    relative_interest NUMERIC(5, 2) NOT NULL,
    search_volume_est INTEGER,
    region VARCHAR(10) NOT NULL DEFAULT 'GLOBAL'
);

CREATE TABLE IF NOT EXISTS saved_trends (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    trend_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ML Evaluations Table
CREATE TABLE IF NOT EXISTS ml_model_evaluations (
    id UUID PRIMARY KEY,
    model_name VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL DEFAULT 'trend',
    entity_id VARCHAR(128),
    topic VARCHAR(512),
    mae FLOAT,
    rmse FLOAT,
    mape FLOAT,
    r2_score FLOAT,
    ci_coverage_pct FLOAT,
    fit_quality VARCHAR(32) NOT NULL DEFAULT 'moderate',
    latency_ms FLOAT NOT NULL DEFAULT 0.0,
    observations_count INTEGER NOT NULL DEFAULT 0,
    data_source VARCHAR(64) NOT NULL DEFAULT 'real_history',
    status VARCHAR(32) NOT NULL DEFAULT 'success',
    metrics_payload JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
