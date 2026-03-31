import asyncio
import os
import uuid
import httpx
from datetime import date, datetime, timedelta, timezone

# Configuration
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY", "0b6a38d03b33ba5ad18f4f665f6055da7c5453e4970a94f4a5381ce2bf576038")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "local-dev-internal-token")
TREND_SERVICE_URL = os.getenv("TREND_SERVICE_URL", "http://localhost:8003")

# Strategic niches to monitor
NICHES = [
    "AI Automation", "Generative AI", "Web3", "Personal Finance", 
    "SaaS", "Creator Economy", "E-commerce", "Fitness Tech",
    "Mental Health", "Sustainable Living", "B2B Marketing", "Gaming"
]

async def fetch_signals(niche: str):
    """Fetch related queries from SerpApi for a specific niche."""
    print(f"[*] Fetching signals for niche: {niche}")
    params = {
        "engine": "google_trends",
        "q": niche,
        "data_type": "RELATED_QUERIES",
        "gprop": "youtube",
        "api_key": SERPAPI_API_KEY,
        "date": "today 3-m"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            r = await client.get("https://serpapi.com/search.json", params=params)
            r.raise_for_status()
            data = r.json()
            return data.get("related_queries", {}).get("rising", [])
        except Exception as e:
            print(f"[!] Error fetching {niche}: {e}")
            return []

def calculate_tvs(query_data: dict) -> float:
    """Calculate Trend Velocity Score (0-100) based on growth signals."""
    extraction = query_data.get("extraction", "")
    if extraction == "Breakout":
        return 95.0 + (uuid.uuid4().int % 5) # High velocity for breakout
    
    # Try to parse percentage growth (e.g. "+420%")
    try:
        if isinstance(extraction, str) and "+" in extraction:
            val = int(extraction.replace("+", "").replace("%", "").replace(",", ""))
            # Map growth to log scale 0-90
            import math
            score = min(90.0, 20.0 + (math.log(val + 1) * 8))
            return score
    except:
        pass
    
    return 50.0 # Default fallback

async def ingest_trends():
    """Main pipeline loop."""
    all_rising = []
    
    for niche in NICHES:
        queries = await fetch_signals(niche)
        for q in queries:
            query_text = q.get("query")
            tvs = calculate_tvs(q)
            
            trend_item = {
                "topic": query_text,
                "topic_slug": query_text.lower().replace(" ", "-")[:100] + "-" + str(uuid.uuid4())[:8],
                "niches": [niche],
                "tvs_score": tvs,
                "prediction_confidence": 0.7 + (uuid.uuid4().int % 25) / 100.0,
                "status": "emerging" if tvs > 80 else "peaking",
                "supported_formats": ["long_form", "shorts"],
                "top_keywords": [query_text, niche, "trending"],
                "description": f"Surging interest in {query_text} within the {niche} ecosystem.",
                "data_sources": ["google_trends", "serpapi"]
            }
            all_rising.append(trend_item)
            
    if not all_rising:
        print("[!] No trends found to ingest.")
        return

    print(f"[*] Ingesting {len(all_rising)} trends...")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Ingest Batch
        r = await client.post(
            f"{TREND_SERVICE_URL}/internal/trends/ingest",
            json={"items": all_rising},
            headers={"X-Internal-Service-Token": INTERNAL_SERVICE_TOKEN}
        )
        r.raise_for_status()
        print(f"[+] Ingested: {r.json()['data']['ingested']} trends.")

        # Note: In a real system, we would trigger recompute_score for each
        # but for this demo, the ingest endpoint already saves them.

if __name__ == "__main__":
    asyncio.run(ingest_trends())
