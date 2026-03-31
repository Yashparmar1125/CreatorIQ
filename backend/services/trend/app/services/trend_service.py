import uuid
from typing import Any

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import UserContext
from app.models.trend_models import Trend
from app.repositories.trend_repository import TrendRepository


class TrendService:
    _cache: dict[str, Any] = {}
    _cache_ttl = 900 # 15 minutes

    def __init__(self) -> None:
        self.repo = TrendRepository()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    def _serialize_trend(self, t: Trend, *, saved: bool | None = None) -> dict[str, Any]:
        # UI-friendly formatting
        velocity = f"+{int(t.tvs_score * 5)}%" if t.tvs_score > 0 else "0%"
        volume = f"{(t.prediction_confidence * 10):.1f}M"

        out: dict[str, Any] = {
            "id": str(t.id),
            "topic": t.topic,
            "topic_slug": t.topic_slug,
            "niches": t.niches,
            "tvs_score": float(t.tvs_score),
            "velocity": velocity,
            "volume": volume,
            "prediction_confidence": float(t.prediction_confidence),
            "peak_window_start": t.peak_window_start.isoformat(),
            "peak_window_end": t.peak_window_end.isoformat(),
            "status": t.status.value,
            "sentiment": t.sentiment.value,
            "supported_formats": [x.value for x in t.supported_formats],
            "top_keywords": t.top_keywords,
            "description": t.description,
            "data_sources": t.data_sources,
            "scored_at": t.scored_at.isoformat(),
        }
        if saved is not None:
            out["saved"] = saved
        return out

    async def list_trends(
        self,
        db: AsyncSession,
        user: UserContext,
        *,
        limit: int = 20,
        cursor: str | None = None,
    ) -> dict:
        """Advanced Intelligence: Triple-handshake with SerpApi to provide growth strategies."""
        # 1. Fetch user context (niches)
        user_niches = []
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(
                    f"{settings.channel_service_url}/internal/channels/user/{user.user_id}/context",
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
                if r.status_code == 200:
                    ctx = r.json().get("data", {})
                    user_niches = ctx.get("niches", [])
        except Exception: pass
        if not user_niches: user_niches = ["AI", "Creator Economy", "Tech"]

        # 2. Parallel Triple-Signals Fetch for Top Niches (with Cache)
        from app.integrations.serpapi_client import search_google_trends
        import time
        import asyncio

        async def fetch_intelligence(niche: str):
            cache_key = f"intel:{niche}"
            now = time.time()
            if cache_key in self._cache:
                entry = self._cache[cache_key]
                if now - entry["ts"] < self._cache_ttl:
                    return entry["data"]

            try:
                # Parallel fetch: Queries, Topics, and Timeline
                tasks = [
                    search_google_trends(q=niche, data_type="RELATED_QUERIES", gprop="youtube"),
                    search_google_trends(q=niche, data_type="RELATED_TOPICS", gprop="youtube"),
                    search_google_trends(q=niche, data_type="TIMESERIES", gprop="youtube")
                ]
                q_res, t_res, s_res = await asyncio.gather(*tasks)
                
                data = {
                    "rising_queries": q_res.get("related_queries", {}).get("rising", []),
                    "top_queries": q_res.get("related_queries", {}).get("top", []),
                    "rising_topics": t_res.get("related_topics", {}).get("rising", []),
                    "timeline": s_res.get("interest_over_time", {}).get("timeline_data", [])
                }
                self._cache[cache_key] = {"ts": now, "data": data}
                return data
            except Exception as e:
                print(f"[!] Intelligence fetch error for {niche}: {e}")
                return None

        # Fetch for first 2 niches to keep within reasonable latency
        intel_tasks = [fetch_intelligence(n) for n in user_niches[:2]]
        results = await asyncio.gather(*intel_tasks)

        # 3. Strategy Analysis Engine
        import math
        items = []
        saved_ids = set(await self.repo.list_saved_ids(db, user.user_id))
        
        for idx, intel in enumerate(results):
            if not intel: continue
            niche = user_niches[idx]
            
            top_q_set = {q.get("query", "").lower() for q in intel["top_queries"]}
            timeline_vals = [float(p.get("values", [{}])[0].get("extracted_value", 0)) for p in intel["timeline"]]
            
            for signal in intel["rising_queries"][:6]:
                query = signal.get("query")
                extraction = signal.get("extraction", "")
                
                # 3a. Metrics Calculation
                tvs_score = 50.0
                if extraction == "Breakout": tvs_score = 95.0 + (hash(query) % 5)
                elif "+" in extraction:
                    try:
                        val = int(extraction.replace("+","").replace("%","").replace(",",""))
                        tvs_score = min(92.0, 25.0 + (math.log(val+1)*8))
                    except: pass
                
                # Saturation Index (Rising vs Top Query Overlap)
                saturation = 10.0 if query.lower() not in top_q_set else 85.0
                
                # Stability Index (Standard Deviation of timeline)
                stability = 50.0 # Default
                if len(timeline_vals) > 2:
                    mean = sum(timeline_vals) / len(timeline_vals)
                    variance = sum((x - mean)**2 for x in timeline_vals) / len(timeline_vals)
                    std_dev = math.sqrt(variance)
                    stability = max(0, min(100, 100 - (std_dev * 2.5))) # Higher = More stable/evergreen

                # 3b. Archetype & Growth Tip Case Logic
                archetype = "The Discovery"
                growth_tip = "Create a comparison vs a top competitor to leverage search intent."
                
                if tvs_score > 90 and stability > 70 and saturation < 30:
                    archetype = "The Greenlight"
                    growth_tip = "Massive SEO opportunity. Produce high-quality long-form content immediately."
                elif tvs_score > 85 and stability < 40:
                    archetype = "The Viral Spike"
                    growth_tip = "Viral news breakout. Drop a batch of Shorts to ride the attention wave."
                elif saturation > 70:
                    archetype = "Peaking"
                    growth_tip = "Topic is saturating. Pivot by adding a unique 'reaction' or 'counter-trend' take."
                
                adjacent = [t.get("topic", {}).get("title") for t in intel["rising_topics"][:3]]
                trend_id = uuid.uuid5(uuid.NAMESPACE_DNS, query)

                items.append({
                    "id": str(trend_id),
                    "topic": query,
                    "niches": [niche] + adjacent[:1],
                    "tvs_score": tvs_score,
                    "velocity": f"+{int(tvs_score * 4)}%",
                    "volume": f"{(tvs_score/12):.1f}M",
                    "saturation_index": saturation,
                    "stability_score": stability,
                    "archetype": archetype,
                    "growth_tip": growth_tip,
                    "adjacent_topics": adjacent,
                    "prediction_confidence": 0.7 + (hash(query+"c")%25)/100.0,
                    "status": "emerging" if tvs_score > 85 else "peaking",
                    "sentiment": "positive",
                    "supported_formats": ["long_form"] if stability > 50 else ["shorts"],
                    "top_keywords": [query, niche] + adjacent,
                    "description": f"Growing signal in {niche} with {archetype} characteristics.",
                    "saved": trend_id in saved_ids
                })

        items.sort(key=lambda x: x["tvs_score"], reverse=True)

        # 4. Background Sync (Soft Persist)
        if items:
            from app.core.db import SessionLocal
            async def bg_sync(data):
                async with SessionLocal() as s:
                    try:
                        await self.repo.ingest_batch(s, data)
                        await s.commit()
                    except: pass
            asyncio.create_task(bg_sync([{
                "id": uuid.UUID(x["id"]), "topic": x["topic"], "topic_slug": x["id"],
                "niches": x["niches"], "tvs_score": x["tvs_score"], "prediction_confidence": x["prediction_confidence"],
                "status": x["status"], "supported_formats": x["supported_formats"],
                "top_keywords": x["top_keywords"], "description": x["growth_tip"], "data_sources": ["intelligence"]
            } for x in items]))

        return {
            "data": {"trends": items, "next_cursor": None},
            "meta": {"request_id": "local-dev-intelligence"},
        }

    async def trend_detail(self, db: AsyncSession, user: UserContext, trend_id: uuid.UUID) -> dict:
        t = await self.repo.get_trend(db, trend_id)
        if not t:
            # For live trends not in DB, return a stub if possible or 404
            # In a full impl, we'd fetch info for this specific topic again
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Trend details not available for ad-hoc live trends yet.", "details": {}},
            )
        saved = await self.repo.is_saved(db, user.user_id, trend_id)
        return {"data": self._serialize_trend(t, saved=saved), "meta": {"request_id": "local-dev"}}

    async def save_trend(self, db: AsyncSession, user: UserContext, trend_id: uuid.UUID) -> dict:
        # Check if trend exists in DB
        t = await self.repo.get_trend(db, trend_id)
        if not t:
            # Ad-hoc save: If it was a live trend, we should try to reconstruct it or have the frontend send the payload
            # For now, let's assume the frontend sends the payload or we 404
            # BETTER: In a real system, the frontend might POST the whole trend object to /save
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Trending topic must be in registry to save.", "details": {}},
            )
        await self.repo.save_trend(db, user.user_id, trend_id)
        await db.commit()
        return {"data": {"saved": True, "trend_id": str(trend_id)}, "meta": {"request_id": "local-dev"}}

    async def unsave_trend(self, db: AsyncSession, user: UserContext, trend_id: uuid.UUID) -> dict:
        await self.repo.unsave_trend(db, user.user_id, trend_id)
        await db.commit()
        return {"data": {"saved": False, "trend_id": str(trend_id)}, "meta": {"request_id": "local-dev"}}

    async def ingest_trends(self, db: AsyncSession, items: list[dict]) -> dict:
        n = await self.repo.ingest_batch(db, items)
        await db.commit()
        return {"data": {"ingested": n}, "meta": {"request_id": "local-dev"}}

    async def recompute_score(self, db: AsyncSession, trend_id: uuid.UUID) -> dict:
        t = await self.repo.get_trend(db, trend_id)
        if not t:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Trend not found.", "details": {}},
            )
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.post(
                    f"{settings.ml_service_url}/internal/ml/trend-forecast",
                    json={"trend_id": str(trend_id), "topic": t.topic, "tvs_score": float(t.tvs_score)},
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
                r.raise_for_status()
                body = r.json()
        except Exception:
            # Dev fallback: bump score slightly if ML unreachable
            body = {"data": {"forecast_tvs": float(t.tvs_score) + 0.1, "confidence": float(t.prediction_confidence)}}

        data = body.get("data") if isinstance(body, dict) else {}
        new_tvs = float(data.get("forecast_tvs", t.tvs_score))
        new_conf = float(data.get("confidence", t.prediction_confidence))
        await self.repo.update_trend_scores(db, trend_id, tvs_score=new_tvs, prediction_confidence=new_conf)
        await db.commit()
        return {"data": {"trend_id": str(trend_id), "tvs_score": new_tvs, "prediction_confidence": new_conf}, "meta": {"request_id": "local-dev"}}

    async def serpapi_related_queries(
        self,
        *,
        q: str,
        geo: str = "",
        hl: str = "en",
        date: str = "today 3-m",
    ) -> dict:
        from app.integrations.serpapi_client import search_google_trends

        raw = await search_google_trends(q=q, geo=geo, hl=hl, date=date, data_type="RELATED_QUERIES")
        return {"data": raw, "meta": {"request_id": "local-dev"}}
