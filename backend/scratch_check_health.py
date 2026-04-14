import httpx
import asyncio

services = {
    "API Gateway": "http://127.0.0.1:8000/health",  # Based on its main.py + router
    "Auth Service": "http://127.0.0.1:8001/auth/health",
    "Channel Service": "http://127.0.0.1:8002/health",
    "Trend Service": "http://127.0.0.1:8003/trends/health",
    "ML Service": "http://127.0.0.1:8007/health" # ML doesn't seem to have a prefix in main.py
}

async def check_health():
    async with httpx.AsyncClient(timeout=5.0) as client:
        for name, url in services.items():
            try:
                r = await client.get(url)
                print(f"{name} ({url}): {r.status_code}")
                if r.status_code != 200:
                    print(f"  Response: {r.text[:100]}")
            except Exception as e:
                print(f"{name} ({url}): FAILED ({type(e).__name__})")

if __name__ == "__main__":
    asyncio.run(check_health())
