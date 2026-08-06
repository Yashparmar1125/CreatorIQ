import uuid
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import SessionLocal
from app.integrations.youtube_analytics_client import YouTubeAnalyticsClient
from app.repositories.analytics_repository import AnalyticsRepository


async def sync_youtube_analytics():
    print("Starting YouTube Analytics Sync Job...")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"X-Internal-Service-Token": settings.internal_service_token}
            url = f"{settings.auth_service_url.rstrip('/')}/internal/auth/youtube/tokens"

            res = await client.get(url, headers=headers)
            if res.status_code != 200:
                print(f"Failed to fetch tokens from auth service: {res.status_code} - {res.text}")
                return

            data = res.json().get("data", {}).get("tokens", [])
            print(f"Found {len(data)} active tokens to sync.")

            analytics_client = YouTubeAnalyticsClient()
            repo = AnalyticsRepository()

            for item in data:
                channel_id_str = item.get("channel_id")
                if not channel_id_str:
                    continue

                channel_id = uuid.UUID(channel_id_str)
                access_token = item.get("access_token")

                summary = await analytics_client.fetch_channel_summary(access_token, client=client)
                geo = await analytics_client.fetch_audience_geography(access_token, client=client)

                if summary or geo:
                    payload = {
                        "source": "youtube_analytics",
                        "summary": summary or {},
                        "audience_geography": geo or {},
                    }
                    async with SessionLocal() as db:
                        today = datetime.now(timezone.utc).date()
                        await repo.create_snapshot(
                            db,
                            channel_id=channel_id,
                            start_date=today - timedelta(days=1),
                            end_date=today,
                            payload=payload,
                        )
                        await db.commit()
                        print(f"Synced YouTube Analytics snapshot for channel: {channel_id}")
    except Exception as e:
        print(f"Error in sync_youtube_analytics job: {e}")
    finally:
        print("YouTube Analytics Sync Job Finished.")
