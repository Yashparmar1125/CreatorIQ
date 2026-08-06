"""YouTube Analytics client unit tests."""

from app.integrations.youtube_analytics_client import normalize_geo_weights, parse_geography_report


def test_normalize_geo_weights():
    assert normalize_geo_weights([("US", 75), ("IN", 25)]) == {"US": 0.75, "IN": 0.25}


def test_parse_geography_report():
    payload = {
        "columnHeaders": [{"name": "country"}, {"name": "views"}],
        "rows": [["US", 600], ["IN", 400]],
    }
    assert parse_geography_report(payload) == {"US": 0.6, "IN": 0.4}
