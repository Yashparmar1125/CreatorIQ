import asyncio
import httpx
import uuid

async def test_internal_upsert():
    url = "http://127.0.0.1:8002/v1/internal/channels/upsert-from-oauth"
    headers = {"X-Internal-Token": "local-dev-internal-token"}
    payload = {
        "user_id": str(uuid.uuid4()),
        "youtube_channel_id": "UC_TEST_CHANNEL_ID",
        "name": "Antigravity Test Channel",
        "handle": "@antigravity",
        "thumbnail_url": "https://example.com/thumb.jpg",
        "subscriber_count": 1337,
        "video_count": 42
    }
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json=payload, headers=headers)
            print(f"Status: {res.status_code}")
            print(f"Response: {res.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_internal_upsert())
