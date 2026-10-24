from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"


class GoogleCalendarClient:
    """Client for Google Calendar API v3 (primary calendar availability & milestone scheduling)."""

    async def list_upcoming_events(
        self,
        access_token: str,
        *,
        days_ahead: int = 14,
        max_results: int = 25,
        client: httpx.AsyncClient | None = None,
    ) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        time_min = now.isoformat().replace("+00:00", "Z")
        time_max = (now + timedelta(days=max(1, min(days_ahead, 60)))).isoformat().replace("+00:00", "Z")

        params = {
            "timeMin": time_min,
            "timeMax": time_max,
            "singleEvents": "true",
            "orderBy": "startTime",
            "maxResults": max_results,
        }
        headers = {"Authorization": f"Bearer {access_token}"}

        own_client = client is None
        if own_client:
            client = httpx.AsyncClient(timeout=20.0)

        try:
            res = await client.get(CALENDAR_EVENTS_URL, params=params, headers=headers)
            if res.status_code != 200:
                logger.warning("Google Calendar list events returned %s: %s", res.status_code, res.text[:200])
                return []

            items = res.json().get("items", [])
            events: list[dict[str, Any]] = []
            for item in items:
                if item.get("status") == "cancelled":
                    continue
                start_obj = item.get("start", {})
                end_obj = item.get("end", {})
                events.append({
                    "id": item.get("id"),
                    "title": item.get("summary") or "Busy",
                    "start": start_obj.get("dateTime") or start_obj.get("date"),
                    "end": end_obj.get("dateTime") or end_obj.get("date"),
                    "description": (item.get("description") or "")[:300],
                    "html_link": item.get("htmlLink"),
                })
            return events
        except Exception as e:
            logger.warning("Google Calendar list_upcoming_events error: %s", e)
            return []
        finally:
            if own_client and client:
                await client.aclose()

    async def create_event(
        self,
        access_token: str,
        *,
        title: str,
        start_iso: str,
        duration_minutes: int = 60,
        description: str = "",
        client: httpx.AsyncClient | None = None,
    ) -> dict[str, Any] | None:
        try:
            clean_iso = start_iso.strip()
            if clean_iso.endswith("Z"):
                start_dt = datetime.fromisoformat(clean_iso.replace("Z", "+00:00"))
            else:
                start_dt = datetime.fromisoformat(clean_iso)
                if start_dt.tzinfo is None:
                    # Default to IST (+05:30) if naive timestamp provided by LLM
                    ist = timezone(timedelta(hours=5, minutes=30))
                    start_dt = start_dt.replace(tzinfo=ist)
        except Exception:
            # Fallback to tomorrow 6:00 PM IST if unparseable
            ist = timezone(timedelta(hours=5, minutes=30))
            tomorrow = datetime.now(ist) + timedelta(days=1)
            start_dt = tomorrow.replace(hour=18, minute=0, second=0, microsecond=0)

        end_dt = start_dt + timedelta(minutes=max(15, min(duration_minutes, 480)))

        body = {
            "summary": title,
            "description": description,
            "start": {"dateTime": start_dt.isoformat()},
            "end": {"dateTime": end_dt.isoformat()},
        }
        headers = {"Authorization": f"Bearer {access_token}"}

        own_client = client is None
        if own_client:
            client = httpx.AsyncClient(timeout=20.0)

        try:
            res = await client.post(CALENDAR_EVENTS_URL, json=body, headers=headers)
            if res.status_code not in (200, 201):
                err_msg = res.text[:400]
                try:
                    err_msg = res.json().get("error", {}).get("message") or err_msg
                except Exception:
                    pass
                logger.error("Google Calendar create_event failed %s: %s", res.status_code, err_msg)
                return {"error": err_msg, "status_code": res.status_code}
            data = res.json()
            return {
                "id": data.get("id"),
                "title": data.get("summary") or title,
                "start": data.get("start", {}).get("dateTime") or start_dt.isoformat(),
                "end": data.get("end", {}).get("dateTime") or end_dt.isoformat(),
                "html_link": data.get("htmlLink"),
            }
        except Exception as e:
            logger.exception("Google Calendar create_event exception: %s", e)
            return None
        finally:
            if own_client and client:
                await client.aclose()
