"""YouTube Analytics API v2 client — audience geography and channel summaries."""

from __future__ import annotations

import logging
from datetime import date, timedelta

import httpx

logger = logging.getLogger(__name__)

YOUTUBE_ANALYTICS_REPORTS_URL = "https://youtubeanalytics.googleapis.com/v2/reports"
MIN_VIEWS_FOR_ANALYTICS_GEO = 1000


def normalize_geo_weights(rows: list[tuple[str, int]]) -> dict[str, float]:
    """Convert country view counts to normalized weights (sum = 1.0)."""
    cleaned = [(code.upper(), views) for code, views in rows if code and views > 0]
    total = sum(views for _, views in cleaned)
    if total <= 0:
        return {}
    return {code: round(views / total, 4) for code, views in cleaned}


def parse_geography_report(payload: dict) -> dict[str, float]:
    headers = [h.get("name") for h in payload.get("columnHeaders", [])]
    if "country" not in headers or "views" not in headers:
        return {}
    country_idx = headers.index("country")
    views_idx = headers.index("views")
    rows: list[tuple[str, int]] = []
    for row in payload.get("rows", []):
        if len(row) <= max(country_idx, views_idx):
            continue
        country = str(row[country_idx]).strip()
        try:
            views = int(row[views_idx])
        except (TypeError, ValueError):
            continue
        rows.append((country, views))
    return normalize_geo_weights(rows)


class YouTubeAnalyticsClient:
    async def fetch_audience_geography(
        self,
        access_token: str,
        *,
        lookback_days: int = 90,
        client: httpx.AsyncClient | None = None,
    ) -> dict[str, float] | None:
        end = date.today()
        start = end - timedelta(days=lookback_days)
        params = {
            "ids": "channel==MINE",
            "startDate": start.isoformat(),
            "endDate": end.isoformat(),
            "metrics": "views",
            "dimensions": "country",
            "sort": "-views",
            "maxResults": 25,
        }
        headers = {"Authorization": f"Bearer {access_token}"}

        owns_client = client is None
        http = client or httpx.AsyncClient(timeout=30.0)
        try:
            res = await http.get(YOUTUBE_ANALYTICS_REPORTS_URL, params=params, headers=headers)
            if res.status_code in (401, 403):
                logger.warning("YouTube Analytics geography forbidden (scope missing?): %s", res.text[:200])
                return None
            if res.status_code != 200:
                logger.warning("YouTube Analytics geography failed: %s %s", res.status_code, res.text[:300])
                return None
            weights = parse_geography_report(res.json())
            return weights or None
        except Exception:
            logger.exception("YouTube Analytics geography request error")
            return None
        finally:
            if owns_client:
                await http.aclose()

    async def fetch_channel_summary(
        self,
        access_token: str,
        *,
        lookback_days: int = 28,
        client: httpx.AsyncClient | None = None,
    ) -> dict | None:
        """Daily channel metrics for analytics snapshots."""
        end = date.today()
        start = end - timedelta(days=lookback_days)
        params = {
            "ids": "channel==MINE",
            "startDate": start.isoformat(),
            "endDate": end.isoformat(),
            "metrics": "views,estimatedMinutesWatched,subscribersGained,subscribersLost",
            "dimensions": "day",
            "sort": "day",
        }
        headers = {"Authorization": f"Bearer {access_token}"}

        owns_client = client is None
        http = client or httpx.AsyncClient(timeout=30.0)
        try:
            res = await http.get(YOUTUBE_ANALYTICS_REPORTS_URL, params=params, headers=headers)
            if res.status_code != 200:
                logger.warning("YouTube Analytics summary failed: %s", res.status_code)
                return None
            data = res.json()
            headers_list = [h.get("name") for h in data.get("columnHeaders", [])]
            totals = {"views": 0, "estimatedMinutesWatched": 0, "subscribersGained": 0, "subscribersLost": 0}
            for row in data.get("rows", []):
                for idx, name in enumerate(headers_list):
                    if name in totals and idx < len(row):
                        try:
                            totals[name] += int(row[idx])
                        except (TypeError, ValueError):
                            pass
            totals["days"] = len(data.get("rows", []))
            return totals
        except Exception:
            logger.exception("YouTube Analytics summary request error")
            return None
        finally:
            if owns_client:
                await http.aclose()
