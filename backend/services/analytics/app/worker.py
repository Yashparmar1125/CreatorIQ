import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import SessionLocal
from app.repositories.analytics_repository import AnalyticsRepository


async def _fetch_youtube_stats(client: httpx.AsyncClient, access_token: str) -> dict | None:
    try:
        # Fetch channel stats
        res = await client.get(
            "https://www.googleapis.com/youtube/v3/channels",
            params={"part": "statistics,contentDetails,snippet", "mine": "true"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if res.status_code != 200:
            return None
        
        items = res.json().get("items", [])
        if not items:
            return None
            
        channel = items[0]
        stats = channel.get("statistics", {})
        
        payload = {
            "views": int(stats.get("viewCount", 0)),
            "subscribers": int(stats.get("subscriberCount", 0)),
            "videos_count": int(stats.get("videoCount", 0)),
            "videos": [], # Can populate with recent videos if needed later
        }
        return payload
    except Exception as e:
        print(f"Error fetching YT stats: {e}")
        return None


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
            
            repo = AnalyticsRepository()
            
            for item in data:
                channel_id_str = item.get("channel_id")
                # Fallback to user_id if channel_id is none (depends on onboarding flow, but user.id can act as channel_id temporarily or skip)
                if not channel_id_str:
                    continue
                    
                channel_id = uuid.UUID(channel_id_str)
                access_token = item.get("access_token")
                
                stats = await _fetch_youtube_stats(client, access_token)
                if stats:
                    # Save to DB
                    async with SessionLocal() as db:
                        today = datetime.now(timezone.utc).date()
                        # Creating a daily snapshot
                        await repo.create_snapshot(
                            db,
                            channel_id=channel_id,
                            start_date=today - timedelta(days=1),
                            end_date=today,
                            payload=stats
                        )
                        await db.commit()
                        print(f"Synced analytics for channel: {channel_id}")
    except Exception as e:
        print(f"Error in sync_youtube_analytics job: {e}")
    finally:
        print("YouTube Analytics Sync Job Finished.")
