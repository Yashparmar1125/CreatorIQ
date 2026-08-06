"""Onboarding pipeline unit tests."""

import uuid

import pytest

from app.services.creator_context_pipeline import (
    build_geo_weights,
    classify_maturity,
    map_content_format,
    map_tone,
    merge_niches,
    resolve_geo_weights,
)
from app.models.creator_profile_models import GeoSource, NicheSource, ProfileMaturity


def test_classify_maturity_new():
    assert classify_maturity(video_count=0, subscriber_count=0, view_count=0) == ProfileMaturity.new
    assert classify_maturity(video_count=5, subscriber_count=0, view_count=50) == ProfileMaturity.new


def test_classify_maturity_emerging():
    assert classify_maturity(video_count=5, subscriber_count=200, view_count=5000) == ProfileMaturity.emerging


def test_classify_maturity_established():
    assert classify_maturity(video_count=25, subscriber_count=2000, view_count=50000) == ProfileMaturity.established


def test_map_format_and_tone():
    assert map_content_format("long-form") == "long_form"
    assert map_content_format("hybrid") == "both"
    assert map_tone("Magnetic") == "entertaining"
    assert map_tone("Expert") == "authoritative"


def test_merge_niches_new_channel():
    effective, source = merge_niches(
        onboarding=["Tech", "Education"],
        inferred=["Gaming"],
        maturity=ProfileMaturity.new,
    )
    assert effective == ["Tech", "Education"]
    assert source == NicheSource.onboarding


def test_merge_niches_established():
    effective, source = merge_niches(
        onboarding=["Tech"],
        inferred=["AI", "Software"],
        maturity=ProfileMaturity.established,
    )
    assert "AI" in effective
    assert source == NicheSource.channel_primary


def test_geo_weights_india():
    weights, source = build_geo_weights("India")
    assert weights == {"IN": 1.0}
    assert source.value == "onboarding_country"


def test_resolve_geo_weights_prefers_analytics():
    weights, source = resolve_geo_weights(
        "India",
        analytics_weights={"US": 0.6, "IN": 0.4},
        view_count=5000,
    )
    assert weights == {"US": 0.6, "IN": 0.4}
    assert source == GeoSource.youtube_analytics


def test_resolve_geo_weights_fallback_below_view_threshold():
    weights, source = resolve_geo_weights(
        "India",
        analytics_weights={"US": 0.6, "IN": 0.4},
        view_count=500,
    )
    assert weights == {"IN": 1.0}
    assert source == GeoSource.onboarding_country
