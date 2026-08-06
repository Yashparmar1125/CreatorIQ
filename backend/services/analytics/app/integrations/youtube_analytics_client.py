"""YouTube Analytics API client (analytics service copy)."""

from __future__ import annotations

import logging
from datetime import date, timedelta

import httpx

logger = logging.getLogger(__name__)

YOUTUBE_ANALYTICS_REPORTS_URL = "https://youtubeanalytics.googleapis.com/v2/reports"


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
    total = sum(v for _, v in rows)
    if total <= 0:
        return {}
    return {code: round(views / total, 4) for code, views in rows if code and views > 0}


class YouTubeAnalyticsClient:
    async def fetch_channel_summary(
        self,
        access_token: str,
        *,
        lookback_days: int = 28,
        client: httpx.AsyncClient | None = None,
    ) -> dict | None:
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
            if res.status_code != 200:
                return None
            weights = parse_geography_report(res.json())
            return weights or None
        except Exception:
            logger.exception("YouTube Analytics geography request error")
            return None
        finally:
            if owns_client:
                await http.aclose()
