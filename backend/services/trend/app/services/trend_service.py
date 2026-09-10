import asyncio
import math
import time
import uuid
from typing import Any

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import UserContext
from app.models.trend_models import Trend, TrendSignal
from app.models.concept_models import ConceptSignal
from app.repositories.trend_repository import TrendRepository
from app.services.feed_service import FeedService
from app.services.concept_collector import ConceptCollector

# ─────────────────────────────────────────────────────────────────────────────
# Niche → google_trends_trending_now category_id mapping
# IDs verified from LIVE API responses (different from google_trends engine!):
#   0  = All Topics   4  = Entertainment   5  = Food & Drink
#   7  = Health       8  = Hobbies         17 = Sports
# ─────────────────────────────────────────────────────────────────────────────
_NICHE_CATEGORY_MAP: dict[str, str] = {
    # Entertainment (4)
    "entertainment": "4",
    "music":         "4",
    "movies":        "4",
    "anime":         "4",
    "comedy":        "4",
    "memes":         "4",
    # Sports (17)
    "sports":   "17",
    "cricket":  "17",
    "football": "17",
    "esports":  "17",
    # Health / Fitness (7)
    "health":        "7",
    "fitness":       "7",
    "wellness":      "7",
    "mental health": "7",
    # Food & Drink (5)
    "food":     "5",
    "cooking":  "5",
    "recipes":  "5",
    # Hobbies & Leisure (8)
    "gaming":    "8",
    "games":     "8",
    "travel":    "8",
    "lifestyle": "8",
    "fashion":   "8",
    "beauty":    "8",
    # All Topics (0) — tech/finance not well-covered by trending_now categories in IN
    "tech":                    "0",
    "technology":              "0",
    "ai":                      "0",
    "artificial intelligence": "0",
    "software":                "0",
    "programming":             "0",
    "coding":                  "0",
    "gadgets":                 "0",
    "apps":                    "0",
    "creator economy":         "0",
    "finance":                 "0",
    "investing":               "0",
    "crypto":                  "0",
    "stocks":                  "0",
    "business":                "0",
    "education":               "0",
    "learning":                "0",
    "career":                  "0",
    "vlogging":                "0",
}

# ─────────────────────────────────────────────────────────────────────────────
# Niche → relevant keywords (for post-fetch relevance scoring)
# Used to rank the same pool of trends differently per user's niche
# ─────────────────────────────────────────────────────────────────────────────
_NICHE_KEYWORDS: dict[str, list[str]] = {
    "tech":           ["tech", "technology", "software", "app", "gadget", "phone", "computer", "digital", "ai", "robot", "startup"],
    "technology":     ["tech", "technology", "software", "digital", "innovation", "computer"],
    "ai":             ["ai", "artificial intelligence", "machine learning", "gpt", "chatbot", "model", "openai", "gemini"],
    "gaming":         ["game", "gaming", "esports", "playstation", "xbox", "nintendo", "steam", "tournament", "streamer"],
    "entertainment":  ["movie", "film", "series", "actor", "actress", "show", "ott", "netflix", "disney", "bollywood"],
    "music":          ["music", "song", "album", "singer", "band", "concert", "playlist", "spotify"],
    "sports":         ["cricket", "football", "ipl", "match", "team", "player", "tournament", "score", "league"],
    "cricket":        ["cricket", "ipl", "test", "odi", "t20", "bcci", "match", "batsman", "bowler"],
    "finance":        ["finance", "stock", "market", "investment", "money", "bank", "economy", "trading", "nifty", "sensex"],
    "crypto":         ["crypto", "bitcoin", "ethereum", "blockchain", "defi", "nft", "token", "web3"],
    "health":         ["health", "fitness", "medicine", "doctor", "disease", "hospital", "wellness", "diet", "exercise"],
    "fitness":        ["fitness", "gym", "workout", "exercise", "muscle", "weight", "yoga", "run"],
    "food":           ["food", "recipe", "cook", "restaurant", "cuisine", "dish", "meal", "chef"],
    "education":      ["study", "exam", "school", "college", "university", "learn", "course", "upsc", "jee", "neet"],
    "travel":         ["travel", "trip", "tour", "destination", "hotel", "flight", "visa", "holiday"],
    "beauty":         ["beauty", "skincare", "makeup", "fashion", "style", "outfit"],
    "lifestyle":      ["lifestyle", "motivation", "productivity", "routine", "self", "personal"],
    "vlogging":       ["vlog", "daily", "day in life", "experience", "journey"],
    "creator economy":["creator", "youtube", "content", "social media", "influencer", "brand", "sponsorship"],
    "business":       ["business", "startup", "entrepreneur", "company", "product", "market", "revenue"],
    "comedy":         ["comedy", "funny", "meme", "joke", "stand up", "roast", "humor"],
    "anime":          ["anime", "manga", "naruto", "demon slayer", "one piece", "jujutsu"],
    "movies":         ["movie", "film", "trailer", "review", "director", "actor", "release", "bollywood", "hollywood"],
    "esports":        ["esports", "tournament", "gaming", "valorant", "pubg", "bgmi", "streamer"],
}


def _niche_to_category(niche: str) -> str:
    """Map user niche to a google_trends_trending_now category_id. Falls back to '0' (All)."""
    return _NICHE_CATEGORY_MAP.get(niche.lower().strip(), "0")


def _relevance_score(query: str, related_terms: list[str], niche: str) -> float:
    """
    Returns 0.0–1.0: how well the trending item matches the creator's niche.
    Helps differentiate results even when multiple niches share the same category bucket.
    """
    keywords = _NICHE_KEYWORDS.get(niche.lower().strip(), [niche.lower()])
    text = (query + " " + " ".join(related_terms)).lower()
    hits = sum(1 for kw in keywords if kw in text)
    # 30% keyword hit rate → full score (avoids penalizing broad topics)
    return min(1.0, hits / max(1, len(keywords) * 0.3))

# Tone → Format & Strategy mapping
# ─────────────────────────────────────────────────────────────────────────────
_TONE_FORMAT_MAP = {
    "educational":    ("long_form",  "Create a deep-dive tutorial. Educational audiences reward long-form watch-time."),
    "authoritative":  ("long_form",  "Publish an in-depth analysis or opinion piece — authority channels win on depth."),
    "entertaining":   ("shorts",     "Drop a rapid-fire Short to ride this signal fast before it saturates."),
    "conversational": ("both",       "Start a conversation with a community post + short video to spark engagement."),
    "mixed":          ("both",       "Use a dual strategy — a teaser Short to capture attention + long-form for depth."),
}

# Size tiers for channel-aware growth advice
def _size_tier(subs: int) -> str:
    if subs < 1_000:       return "nano"
    if subs < 10_000:      return "micro"
    if subs < 100_000:     return "mid"
    if subs < 1_000_000:   return "macro"
    return "mega"

_SIZE_PREFIX = {
    "nano":  "As a rising creator, this is your window — move fast.",
    "micro": "Micro-channels who act early on this can 3x their subscriber rate.",
    "mid":   "Your audience size can amplify this trend significantly.",
    "macro": "Your established reach gives this topic 10x reach potential.",
    "mega":  "Your platform reach can own this conversation outright.",
}


class TrendService:
    _cache: dict[str, Any] = {}
    _cache_ttl = 900  # 15 minutes

    def __init__(self) -> None:
        self.repo = TrendRepository()
        self.feed = FeedService()
        self.collector = ConceptCollector()

    def health(self) -> dict:
        return {"data": self.repo.health_payload(), "meta": {"request_id": "local-dev"}}

    # ─────────────────────────────────────────────────────────────────────────
    # Rich Channel Context
    # ─────────────────────────────────────────────────────────────────────────
    async def _get_rich_channel_context(self, user_id: uuid.UUID) -> dict:
        """
        Fetch full channel context from Channel service.
        Returns a dict with:
          - niches:           list[str]
          - content_formats:  list[str]
          - tone:             str
          - subscriber_count: int
          - engagement_rate:  float | None
          - channel_name:     str | None
          - thumbnail_url:    str | None
        Falls back gracefully on any error.
        """
        defaults = {
            "niches": ["AI", "Creator Economy", "Tech"],
            "content_formats": ["long_form", "shorts"],
            "tone": "mixed",
            "subscriber_count": 0,
            "engagement_rate": None,
            "channel_name": None,
            "thumbnail_url": None,
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # 1. Get niches, formats, tone from /context endpoint
                ctx_r = await client.get(
                    f"{settings.channel_service_url}/internal/channels/user/{user_id}/context",
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
                if ctx_r.status_code == 200:
                    ctx = ctx_r.json().get("data", {})
                    defaults["niches"]          = ctx.get("niches") or defaults["niches"]
                    defaults["content_formats"] = ctx.get("content_formats") or defaults["content_formats"]
                    defaults["tone"]            = ctx.get("tone") or defaults["tone"]

                # 2. Get subscriber_count, engagement_rate, channel_name, thumbnail from /channels
                ch_r = await client.get(
                    f"{settings.channel_service_url}/channels",
                    headers={
                        "X-Internal-Service-Token": settings.internal_service_token,
                        "X-User-Id": str(user_id),
                    },
                )
                if ch_r.status_code == 200:
                    channels = ch_r.json().get("data", {}).get("channels", [])
                    primary = next((c for c in channels if c.get("is_primary")), channels[0] if channels else None)
                    if primary:
                        defaults["subscriber_count"] = primary.get("subscriber_count", 0)
                        defaults["engagement_rate"]  = primary.get("engagement_rate")
                        defaults["channel_name"]     = primary.get("name")
                        defaults["thumbnail_url"]    = primary.get("thumbnail_url")
        except Exception as e:
            print(f"[trend] Channel context fetch failed: {e}")
        return defaults

    # ─────────────────────────────────────────────────────────────────────────
    # SerpApi — google_trends_trending_now  (real live data, per category)
    # ─────────────────────────────────────────────────────────────────────────
    async def _fetch_trending_now(
        self,
        niche: str,
        *,
        geo: str = "IN",
        hours: str = "24",
    ) -> list[dict] | None:
        """
        Fetches real trending searches from Google Trends Trending Now engine.
        Maps the niche string to a Google Trends category_id.
        Returns a normalised list of trending items or None on failure.

        Real SerpApi response shape per item:
        {
          "query":               str,          ← trending topic
          "search_volume":       int,          ← approx search volume (e.g. 20000)
          "increase_percentage": int,          ← % growth (e.g. 1000 = +1000%)
          "active":              bool,         ← is trend currently live?
          "start_timestamp":     int,          ← Unix epoch when it started
          "end_timestamp":       int | None,   ← present if trend ended
          "categories":          [{id, name}], ← Google topic categories
          "trend_breakdown":     [str, ...],   ← related search terms (NOT time-series!)
          "serpapi_news_link":   str,          ← link to fetch news articles
        }
        """
        category_id = _niche_to_category(niche)
        cache_key   = f"trending_now:{geo}:{hours}:{category_id}"
        now         = time.time()

        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if now - entry["ts"] < self._cache_ttl:
                return entry["data"]

        try:
            from app.integrations.serpapi_client import search_trending_now

            raw = await search_trending_now(
                geo=geo,
                hours=hours,
                category_id=category_id,
                hl="en",
            )

            items: list[dict] = []
            for ts in raw.get("trending_searches", []):
                if not isinstance(ts, dict):
                    continue

                query = ts.get("query", "").strip()
                if not query:
                    continue

                # trend_breakdown = list of related SEARCH STRINGS (not numbers!)
                # e.g. ["jananayagan", "jana nayagan release date"]
                raw_breakdown = ts.get("trend_breakdown") or []
                related_terms: list[str] = [
                    t for t in raw_breakdown if isinstance(t, str) and t
                ]

                # Categories (may include the actual topic: Entertainment, Sports, etc.)
                categories: list[str] = [
                    c.get("name", "") for c in (ts.get("categories") or [])
                    if isinstance(c, dict) and c.get("name")
                ]

                items.append({
                    "query":               query,
                    "search_volume":       int(ts.get("search_volume") or 0),
                    "increase_percentage": int(ts.get("increase_percentage") or 0),
                    "active":              bool(ts.get("active", True)),
                    "start_timestamp":     int(ts.get("start_timestamp") or 0),
                    "end_timestamp":       ts.get("end_timestamp"),   # None if still active
                    "related_terms":       related_terms,             # from trend_breakdown strings
                    "categories":          categories,
                    "niche":               niche,
                })

            self._cache[cache_key] = {"ts": now, "data": items}
            return items

        except Exception as e:
            print(f"[trend] google_trends_trending_now error (niche='{niche}', cat={category_id}): {e}")
            return None

    # ─────────────────────────────────────────────────────────────────────────
    # Personalized Growth Tip Generator
    # ─────────────────────────────────────────────────────────────────────────
    def _build_growth_tip(
        self,
        *,
        query: str,
        niche: str,
        tvs_score: float,
        saturation: float,
        stability: float,
        tone: str,
        subscriber_count: int,
        content_formats: list[str],
    ) -> tuple[str, str, str]:
        """
        Returns (archetype, growth_tip, best_format).
        The tip is channel-aware: considers tone, size tier, and content_formats.
        """
        size         = _size_tier(subscriber_count)
        size_prefix  = _SIZE_PREFIX[size]
        tone_fmt, tone_advice = _TONE_FORMAT_MAP.get(tone, _TONE_FORMAT_MAP["mixed"])

        # Determine best format for this user
        user_formats = set(content_formats)
        if "long_form" in user_formats and "shorts" in user_formats:
            best_format = "both"
        elif "long_form" in user_formats:
            best_format = "long_form"
        elif "shorts" in user_formats:
            best_format = "shorts"
        else:
            best_format = tone_fmt

        # Archetype logic
        if tvs_score > 90 and stability > 70 and saturation < 30:
            archetype = "The Greenlight"
            tip = (
                f"{size_prefix} This '{query}' signal is uncrowded and rapidly accelerating. "
                f"{tone_advice} Massive SEO opportunity — publish now."
            )
        elif tvs_score > 85 and stability < 40:
            archetype = "The Viral Spike"
            tip = (
                f"{size_prefix} '{query}' is a breakout spike in {niche}. "
                f"Drop Shorts immediately to ride the attention wave before it peaks."
            )
        elif saturation > 70:
            archetype = "Peaking"
            tip = (
                f"'{query}' is saturating fast. Pivot with a unique counter-angle or reaction video. "
                f"{'Use Shorts for quick takes.' if 'shorts' in user_formats else 'Long-form analysis still wins if differentiated.'}"
            )
        elif tvs_score > 70 and stability > 60:
            archetype = "The Evergreen"
            tip = (
                f"{size_prefix} '{query}' is a stable, consistent performer in {niche}. "
                f"{tone_advice} Build a pillar content series around it."
            )
        else:
            archetype = "The Discovery"
            tip = (
                f"Early signal detected for '{query}'. "
                f"Create a comparison vs a competitor to test engagement — "
                f"{'Shorts work best for fast discovery.' if 'shorts' in user_formats else 'Long-form exploration wins here.'}"
            )

        return archetype, tip, best_format

    # ─────────────────────────────────────────────────────────────────────────
    # Main — list_trends (fully personalized, 100% live)
    # ─────────────────────────────────────────────────────────────────────────
    async def list_trends(
        self,
        db: AsyncSession,
        user: UserContext,
        *,
        q: str | None = None,
        limit: int = 5,
        cursor: str | None = None,
    ) -> dict:
        """Return latest Top-5 feed snapshot, or search concepts when q is set."""
        if q:
            payload = await self.feed.search_concepts(db, user.user_id, q.strip(), limit=min(limit, 5))
            return {"data": payload, "meta": {"request_id": "trend-engine"}}

        feed = await self.feed.get_latest_feed(db, user.user_id)
        if not feed:
            try:
                feed = await self.feed.generate_feed(
                    db, user.user_id, is_first_feed=True, consume_credit=False
                )
            except HTTPException as exc:
                if exc.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
                    return {
                        "data": {
                            "trends": [],
                            "personalized": True,
                            "channel": None,
                            "geo": {"source": "global_default", "badge": None},
                            "credits": {"plan": "free", "limit": 2},
                            "empty_reason": exc.detail.get("message") if isinstance(exc.detail, dict) else str(exc.detail),
                        },
                        "meta": {"request_id": "trend-engine"},
                    }
                raise

        return {"data": feed, "meta": {"request_id": "trend-engine"}}

    async def refresh_feed(self, db: AsyncSession, user: UserContext, *, plan: str = "free") -> dict:
        feed = await self.feed.generate_feed(
            db, user.user_id, is_first_feed=False, consume_credit=True, plan=plan
        )
        return {"data": feed, "meta": {"request_id": "trend-engine"}}

    async def feed_history(self, db: AsyncSession, user: UserContext, *, limit: int = 10) -> dict:
        data = await self.feed.list_history(db, user.user_id, limit=limit)
        return {"data": data, "meta": {"request_id": "trend-engine"}}

    async def get_feed_snapshot(self, db: AsyncSession, user: UserContext, feed_id: uuid.UUID) -> dict:
        feed = await self.feed.get_feed_snapshot(db, user.user_id, feed_id)
        return {"data": feed, "meta": {"request_id": "trend-engine"}}

    async def generate_first_feed(self, db: AsyncSession, user_id: uuid.UUID) -> dict:
        existing = await self.feed.feed_repo.get_latest_snapshot(db, user_id)
        if existing:
            return {"data": {"skipped": True, "feed_id": str(existing.id)}, "meta": {"request_id": "trend-engine"}}
        try:
            feed = await self.feed.generate_feed(
                db, user_id, is_first_feed=True, consume_credit=False
            )
            return {"data": {"generated": True, "feed_id": feed.get("feed_id")}, "meta": {"request_id": "trend-engine"}}
        except HTTPException as exc:
            if exc.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
                return {"data": {"generated": False, "reason": "no_concepts"}, "meta": {"request_id": "trend-engine"}}
            raise

    async def run_collector(self, db: AsyncSession) -> dict:
        n = await self.collector.run_all_clusters(db)
        return {"data": {"ingested_signals": n}, "meta": {"request_id": "trend-engine"}}

    # ─────────────────────────────────────────────────────────────────────────
    # Trend Detail
    # ─────────────────────────────────────────────────────────────────────────
    async def trend_detail(self, db: AsyncSession, user: UserContext, trend_id: uuid.UUID) -> dict:
        saved = await self.repo.is_saved(db, user.user_id, trend_id)

        enriched = await self.feed.feed_repo.find_enriched_item(db, user.user_id, trend_id)
        if enriched:
            enriched["saved"] = saved
            if settings.enable_trend_enrichment:
                ctx = await self.feed.get_creator_context(user.user_id)
                enriched = await self.feed.enrichment.enrich_detail(enriched, ctx)
            return {"data": enriched, "meta": {"request_id": "trend-engine"}}

        concept = await self.feed.concept_repo.get_by_id(db, trend_id)
        if concept:
            ctx = await self.feed.get_creator_context(user.user_id)
            item = self.feed._score_concept(concept, ctx)
            if item:
                item["saved"] = saved
                if settings.enable_trend_enrichment:
                    item = await self.feed.enrichment.enrich_detail(item, ctx)
                return {"data": item, "meta": {"request_id": "trend-engine"}}

        t = await self.repo.get_trend(db, trend_id)
        if not t:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": "Trend not found — it may still be syncing.", "details": {}},
            )
        saved = await self.repo.is_saved(db, user.user_id, trend_id)
        return {"data": self._serialize_trend(t, saved=saved), "meta": {"request_id": "local-dev"}}

    async def get_trend_forecast(self, db: AsyncSession, trend_id: uuid.UUID) -> dict:
        """Fetches Prophet trajectory forecast for a trend/concept from ML service."""
        topic = "Trend Opportunity"
        score = 50.0
        lifecycle = "emerging"
        growth = 0.0
        velocity = 0.0
        history: list[dict[str, Any]] = []

        # Try concept store first
        concept = await self.feed.concept_repo.get_by_id(db, trend_id)
        if concept:
            topic = concept.canonical_title
            raw = float(concept.raw_momentum or 50.0)
            vol = int(concept.search_volume_est or 0)

            # 1. Attempt to find exact personalized opportunity score from feed snapshots
            score = None
            try:
                from sqlalchemy import text
                res = await db.execute(
                    text("""
                        SELECT item->>'opportunity_score'
                        FROM trend_feed_snapshots s,
                             jsonb_array_elements(s.items) item
                        WHERE item->>'id' = :tid
                        ORDER BY s.created_at DESC LIMIT 1
                    """),
                    {"tid": str(trend_id)},
                )
                row = res.fetchone()
                if row and row[0]:
                    score = float(row[0])
            except Exception:
                pass

            if score is None:
                if vol > 0:
                    import math
                    vol_log = math.log10(max(10, vol))
                    score = round(min(92.0, max(25.0, 18.0 + vol_log * 6.5 + raw * 0.5)), 2)
                else:
                    score = round(raw, 2)

            lifecycle = str(concept.lifecycle.value if hasattr(concept.lifecycle, "value") else concept.lifecycle)
            growth = float(concept.google_trends_growth or 0.0)
            velocity = float(concept.youtube_search_velocity or concept.youtube_video_velocity or 0.0)

            # Query real empirical signals if available
            try:
                sig_res = await db.execute(
                    select(ConceptSignal)
                    .where(ConceptSignal.concept_id == trend_id)
                    .order_by(ConceptSignal.captured_at.asc())
                )
                for s in sig_res.scalars().all():
                    val = score
                    if isinstance(s.payload, dict):
                        val = float(s.payload.get("raw_momentum") or s.payload.get("value") or score)
                    history.append({"ds": s.captured_at.strftime("%Y-%m-%d"), "y": val})
            except Exception:
                pass
        else:
            # Check legacy trend table
            t = await self.repo.get_trend(db, trend_id)
            if t:
                topic = t.topic
                score = float(t.tvs_score or 50.0)
                lifecycle = str(t.status.value if hasattr(t.status, "value") else t.status)
                velocity = float(t.prediction_confidence or 0.5) * 2.0

                # Query real empirical trend signals if available
                try:
                    ts_res = await db.execute(
                        select(TrendSignal)
                        .where(TrendSignal.trend_id == trend_id)
                        .order_by(TrendSignal.recorded_at.asc())
                    )
                    for s in ts_res.scalars().all():
                        history.append({"ds": s.recorded_at.strftime("%Y-%m-%d"), "y": float(s.relative_interest)})
                except Exception:
                    pass

        # Call ML Service Prophet endpoint
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.post(
                    f"{settings.ml_service_url}/internal/ml/trend-forecast",
                    json={
                        "trend_id": str(trend_id),
                        "topic": topic,
                        "tvs_score": score,
                        "lifecycle": lifecycle,
                        "growth": growth,
                        "velocity": velocity,
                        "history": history,
                        "periods": 90,
                    },
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
                r.raise_for_status()
                payload = r.json()
                forecast_data = payload.get("data", {})
        except Exception as exc:
            # Fallback in case ML service is unreachable
            from datetime import date, timedelta
            today = date.today()
            trajectory = [
                {
                    "ds": (today + timedelta(days=i)).strftime("%Y-%m-%d"),
                    "yhat": round(min(100.0, max(5.0, score + (i * 0.05))), 2),
                    "yhat_lower": round(max(0.0, score - 5.0), 2),
                    "yhat_upper": round(min(100.0, score + 8.0), 2),
                }
                for i in range(1, 91)
            ]
            w1 = trajectory[6]
            m1 = trajectory[29]
            m3 = trajectory[-1]
            forecast_data = {
                "topic": topic,
                "origin_date": today.strftime("%Y-%m-%d"),
                "current_score": score,
                "horizons": {
                    "1_week": {"target_date": w1["ds"], "forecast_score": w1["yhat"], "lower_bound": w1["yhat_lower"], "upper_bound": w1["yhat_upper"], "direction": "relatively stable", "change_pct": 0.5},
                    "1_month": {"target_date": m1["ds"], "forecast_score": m1["yhat"], "lower_bound": m1["yhat_lower"], "upper_bound": m1["yhat_upper"], "direction": "moderate increase", "change_pct": 2.1},
                    "3_months": {"target_date": m3["ds"], "forecast_score": m3["yhat"], "lower_bound": m3["yhat_lower"], "upper_bound": m3["yhat_upper"], "direction": "moderate increase", "change_pct": 3.8},
                },
                "trajectory": trajectory,
                "metrics": {"avg_velocity": 0.05, "avg_acceleration": 0.0, "uncertainty": "moderate"},
                "model_used": "Fallback_Extrapolation",
            }

        return {"data": forecast_data, "meta": {"request_id": "trend-engine"}}

    # ─────────────────────────────────────────────────────────────────────────
    # Save / Unsave  (live trends auto-upserted before saving)
    # ─────────────────────────────────────────────────────────────────────────
    async def save_trend(
        self,
        db: AsyncSession,
        user: UserContext,
        trend_id: uuid.UUID,
        *,
        trend_data: dict | None = None,
    ) -> dict:
        """
        Save a trend. For live (ad-hoc) trends that aren't in the DB yet,
        pass `trend_data` (full live trend payload) to auto-upsert before saving.
        """
        t = await self.repo.get_trend(db, trend_id)
        if not t:
            if not trend_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "code": "NOT_FOUND",
                        "message": "Trend not in registry. Pass trend_data in the request body to save a live trend.",
                        "details": {},
                    },
                )
            # Auto-upsert the live trend so it can be saved
            await self.repo.upsert_live_trend(db, trend_id, trend_data)
            await db.flush()

        await self.repo.save_trend(db, user.user_id, trend_id)
        await db.commit()
        return {"data": {"saved": True, "trend_id": str(trend_id)}, "meta": {"request_id": "local-dev"}}

    async def unsave_trend(self, db: AsyncSession, user: UserContext, trend_id: uuid.UUID) -> dict:
        await self.repo.unsave_trend(db, user.user_id, trend_id)
        await db.commit()
        return {"data": {"saved": False, "trend_id": str(trend_id)}, "meta": {"request_id": "local-dev"}}

    # ─────────────────────────────────────────────────────────────────────────
    # Internal endpoints
    # ─────────────────────────────────────────────────────────────────────────
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
            body = {"data": {"forecast_tvs": float(t.tvs_score) + 0.1, "confidence": float(t.prediction_confidence)}}

        data    = body.get("data") if isinstance(body, dict) else {}
        new_tvs  = float(data.get("forecast_tvs", t.tvs_score))
        new_conf = float(data.get("confidence",   t.prediction_confidence))
        await self.repo.update_trend_scores(db, trend_id, tvs_score=new_tvs, prediction_confidence=new_conf)
        await db.commit()
        return {
            "data": {"trend_id": str(trend_id), "tvs_score": new_tvs, "prediction_confidence": new_conf},
            "meta": {"request_id": "local-dev"},
        }

    async def serpapi_related_queries(self, *, q: str, geo: str = "", hl: str = "en", date: str = "today 3-m") -> dict:
        from app.integrations.serpapi_client import search_google_trends
        raw = await search_google_trends(q=q, geo=geo, hl=hl, date=date, data_type="RELATED_QUERIES")
        return {"data": raw, "meta": {"request_id": "local-dev"}}

    # ─────────────────────────────────────────────────────────────────────────
    # Serializer (for DB-persisted trends)
    # ─────────────────────────────────────────────────────────────────────────
    def _serialize_trend(self, t: Trend, *, saved: bool | None = None) -> dict[str, Any]:
        velocity = f"+{int(t.tvs_score * 5)}%" if t.tvs_score > 0 else "0%"
        volume   = f"{(t.prediction_confidence * 10):.1f}M"
        out: dict[str, Any] = {
            "id":                    str(t.id),
            "topic":                 t.topic,
            "topic_slug":            t.topic_slug,
            "niches":                t.niches,
            "tvs_score":             float(t.tvs_score),
            "velocity":              velocity,
            "volume":                volume,
            "prediction_confidence": float(t.prediction_confidence),
            "peak_window_start":     t.peak_window_start.isoformat(),
            "peak_window_end":       t.peak_window_end.isoformat(),
            "status":                t.status.value,
            "sentiment":             t.sentiment.value,
            "supported_formats":     [x.value for x in t.supported_formats],
            "top_keywords":          t.top_keywords,
            "description":           t.description,
            "data_sources":          t.data_sources,
            "scored_at":             t.scored_at.isoformat(),
            # Provide defaults for live-trend fields so UI doesn't break
            "archetype":             "The Discovery",
            "growth_tip":            t.description or "Explore this trend early to gain first-mover advantage.",
            "saturation_index":      50.0,
            "stability_score":       50.0,
            "adjacent_topics":       [],
        }
        if saved is not None:
            out["saved"] = saved
        return out
