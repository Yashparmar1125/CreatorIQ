import json
import logging
import uuid
from typing import Any, Callable

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.integrations.youtube_data_client import YouTubeDataClient
from app.models.concept_models import TrendConcept, ConceptDailySignal
from app.models.trend_models import SavedTrend, Trend
from app.repositories.memory_repository import MemoryRepository

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Tool Schemas for Groq / OpenAI Tool-Calling
# ─────────────────────────────────────────────────────────────────────────────
AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_my_channel",
            "description": "Get the creator's connected channel profile: subscriber count, channel name, primary niches, tone, and content formats.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_my_saved_trends",
            "description": "Fetch all concepts and topics the creator has previously saved to their content pipeline.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_trends",
            "description": "Search CreatorIQ's catalog of verified breakout topics, momentum scores, and outlier streaks by niche or keywords.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search term or niche (e.g. 'coding agents', 'fitness over 40', 'budgeting')",
                    },
                    "min_opportunity_score": {
                        "type": "number",
                        "description": "Minimum score filter 0-100 (default: 50.0)",
                        "default": 50.0,
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results to return (default: 5)",
                        "default": 5,
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_trend_detail",
            "description": "Get complete intelligence for a specific trend: actionable verdict (make now vs test short), proof videos from small creators, optimal publishing window, and hook blueprint.",
            "parameters": {
                "type": "object",
                "properties": {
                    "trend_id_or_topic": {
                        "type": "string",
                        "description": "The exact UUID or topic title of the trend",
                    },
                },
                "required": ["trend_id_or_topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_small_channel_outliers",
            "description": "Find recent breakout videos where small creators (<25K subs) beat their normal 30-day baseline by 3x–20x.",
            "parameters": {
                "type": "object",
                "properties": {
                    "niche": {
                        "type": "string",
                        "description": "Niche or category (e.g. 'Tech', 'Fitness', 'Finance')",
                    },
                    "min_multiplier": {
                        "type": "number",
                        "description": "Minimum reach multiplier (e.g. 2.5)",
                        "default": 2.5,
                    },
                },
                "required": ["niche"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "remember",
            "description": "Persist a creator preference, audience insight, or rule into long-term memory so future chats automatically remember it.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Category of memory: 'niche', 'format', 'tone', 'dislike', 'audience', or 'goal'",
                    },
                    "key": {
                        "type": "string",
                        "description": "Short identifier key (e.g. 'preferred_duration', 'avoid_topics', 'primary_niche')",
                    },
                    "value": {
                        "type": "string",
                        "description": "The exact preference or fact to remember",
                    },
                },
                "required": ["category", "key", "value"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the live web using Tavily for current events, news, viral controversies, algorithm updates, or creator discussions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Specific search query (e.g. 'Claude 3.7 Sonnet release reaction YouTube', 'MrBeast controversy 2026')",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_youtube_live",
            "description": "Search YouTube directly in real-time for recent uploads (past 7 days) on any topic to inspect live competitor thumbnails, titles, and view counts.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search terms to find live YouTube videos",
                    },
                    "days": {
                        "type": "integer",
                        "description": "How many days back to look (default: 7)",
                        "default": 7,
                    },
                },
                "required": ["query"],
            },
        },
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Tool Execution Handlers
# ─────────────────────────────────────────────────────────────────────────────
class ToolRegistry:
    def __init__(self) -> None:
        self.memory_repo = MemoryRepository()

    async def execute(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        tool_name: str,
        arguments: dict[str, Any],
        creator_context: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute a registered tool and return clean structured JSON for the LLM."""
        try:
            if tool_name == "get_my_channel":
                return {
                    "channel_name": creator_context.get("channel_name"),
                    "subscriber_count": creator_context.get("subscriber_count", 0),
                    "niches": creator_context.get("niches", []),
                    "tone": creator_context.get("tone", "conversational"),
                    "content_formats": creator_context.get("content_formats", ["shorts", "long_form"]),
                    "connected": bool(creator_context.get("channel_name")),
                }

            elif tool_name == "get_my_saved_trends":
                res = await db.execute(
                    select(SavedTrend, Trend.topic)
                    .outerjoin(Trend, SavedTrend.trend_id == Trend.id)
                    .where(SavedTrend.user_id == user_id)
                    .order_by(SavedTrend.created_at.desc())
                    .limit(10)
                )
                saved_rows = res.all()
                return {
                    "count": len(saved_rows),
                    "saved_trends": [
                        {
                            "trend_id": str(s.trend_id),
                            "topic": topic or "Saved Concept",
                            "saved_at": s.created_at.isoformat() if s.created_at else None,
                        }
                        for s, topic in saved_rows
                    ],
                }

            elif tool_name == "search_trends":
                query_str = arguments.get("query", "").strip()
                min_score = float(arguments.get("min_opportunity_score", 50.0))
                limit = int(arguments.get("limit", 5))

                q = select(TrendConcept).where(TrendConcept.raw_momentum >= min_score)
                if query_str:
                    q = q.where(TrendConcept.canonical_title.ilike(f"%{query_str}%"))
                q = q.order_by(TrendConcept.raw_momentum.desc()).limit(limit)

                res = await db.execute(q)
                concepts = res.scalars().all()

                return {
                    "query": query_str,
                    "matched_count": len(concepts),
                    "trends": [
                        {
                            "id": str(c.id),
                            "topic": c.canonical_title,
                            "opportunity_score": float(c.raw_momentum or 60.0),
                            "lifecycle": str(c.lifecycle.value if hasattr(c.lifecycle, "value") else c.lifecycle),
                            "niches": c.niche_tags or [],
                            "why_trending": c.why_trending,
                            "key_indicator": c.key_indicator,
                        }
                        for c in concepts
                    ],
                }

            elif tool_name == "get_trend_detail":
                trend_id_or_topic = arguments.get("trend_id_or_topic", "").strip()
                concept = None
                try:
                    concept_uuid = uuid.UUID(trend_id_or_topic)
                    c_res = await db.execute(select(TrendConcept).where(TrendConcept.id == concept_uuid))
                    concept = c_res.scalar_one_or_none()
                except ValueError:
                    c_res = await db.execute(
                        select(TrendConcept).where(TrendConcept.canonical_title.ilike(f"%{trend_id_or_topic}%")).limit(1)
                    )
                    concept = c_res.scalar_one_or_none()

                if not concept:
                    return {"status": "not_found", "message": f"Trend '{trend_id_or_topic}' not found in active catalog."}

                # Get latest daily signal
                sig_res = await db.execute(
                    select(ConceptDailySignal)
                    .where(ConceptDailySignal.concept_id == str(concept.id))
                    .order_by(ConceptDailySignal.video_date.desc())
                    .limit(1)
                )
                sig = sig_res.scalar_one_or_none()

                proof_vids = []
                if sig and sig.population:
                    for v in (sig.population or [])[:4]:
                        proof_vids.append({
                            "title": v.get("title"),
                            "channel": v.get("channel_title"),
                            "views": v.get("view_count"),
                            "subscribers": v.get("subscriber_count"),
                            "reach_multiplier": f"{v.get('reach_ratio', 1.0):.1f}x",
                        })

                streak = int(sig.outlier_streak or 0) if sig else 0
                score = float(concept.raw_momentum or 65.0)
                verdict = "Make It Now" if score >= 80 or streak >= 2 else "Test with a Short"

                return {
                    "id": str(concept.id),
                    "topic": concept.canonical_title,
                    "verdict": verdict,
                    "opportunity_score": score,
                    "outlier_streak_days": streak,
                    "proof_videos": proof_vids,
                    "why_trending": concept.why_trending,
                    "optimal_publishing_window": "Next 2–4 Days" if score >= 80 else "Next 3–6 Days",
                }

            elif tool_name == "find_small_channel_outliers":
                niche = arguments.get("niche", "").strip()
                min_mult = float(arguments.get("min_multiplier", 2.5))

                q = select(ConceptDailySignal).where(ConceptDailySignal.population_size > 0).order_by(ConceptDailySignal.video_date.desc()).limit(15)
                res = await db.execute(q)
                signals = res.scalars().all()

                outlier_videos = []
                for s in signals:
                    for v in (s.population or []):
                        subs = int(v.get("subscriber_count") or 0)
                        rr = float(v.get("reach_ratio") or 0.0)
                        if 100 <= subs <= 25_000 and rr >= min_mult:
                            outlier_videos.append({
                                "title": v.get("title"),
                                "channel": v.get("channel_title"),
                                "subscribers": subs,
                                "views": v.get("view_count"),
                                "reach_multiplier": f"{rr:.1f}x",
                                "concept_name": s.concept_name,
                            })
                        if len(outlier_videos) >= 6:
                            break
                    if len(outlier_videos) >= 6:
                        break

                return {
                    "niche": niche,
                    "outlier_count": len(outlier_videos),
                    "outlier_videos": outlier_videos,
                }

            elif tool_name == "remember":
                cat = arguments.get("category", "general")
                key = arguments.get("key", "fact")
                val = arguments.get("value", "").strip()
                mem = await self.memory_repo.upsert_memory(db, user_id, category=cat, key=key, value=val)
                return {"status": "saved", "memory": mem}

            elif tool_name == "recall":
                mems = await self.memory_repo.get_user_memories(db, user_id)
                return {"memories": mems}

            elif tool_name == "search_web":
                query = arguments.get("query", "").strip()
                if not query:
                    return {"error": "Missing search query"}

                raw_keys = settings.tavily_api_keys or settings.tavily_api_key or ""
                keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
                if not keys:
                    return {"status": "skipped", "message": "No Tavily search API key configured."}

                results = None
                for key in keys:
                    try:
                        async with httpx.AsyncClient(timeout=15.0) as client:
                            resp = await client.post(
                                "https://api.tavily.com/search",
                                json={
                                    "api_key": key,
                                    "query": query,
                                    "search_depth": "basic",
                                    "max_results": 5,
                                    "include_answer": True,
                                },
                            )
                            if resp.status_code == 200:
                                data = resp.json()
                                results = {
                                    "query": query,
                                    "direct_answer": data.get("answer"),
                                    "web_results": [
                                        {
                                            "title": r.get("title"),
                                            "url": r.get("url"),
                                            "snippet": (r.get("content") or "")[:280],
                                        }
                                        for r in data.get("results", [])[:4]
                                    ],
                                }
                                break
                    except Exception as err:
                        logger.warning("Tavily search attempt failed with key: %s", err)

                if results:
                    return results
                return {"status": "unavailable", "message": "Search returned no results or rate limit reached."}

            elif tool_name == "search_youtube_live":
                query = arguments.get("query", "").strip()
                days = int(arguments.get("days", 7))
                if not query:
                    return {"error": "Missing search query"}

                try:
                    yt = YouTubeDataClient()
                    vids = await yt.search_videos(
                        q=query,
                        published_after_days=days,
                        order="viewCount",
                        max_results=5,
                    )
                    video_ids = [v["video_id"] for v in vids if v.get("video_id")]
                    stats_map = {}
                    if video_ids:
                        try:
                            stats_map = await yt.get_video_statistics(video_ids)
                        except Exception as stat_err:
                            logger.warning("Failed fetching live video stats: %s", stat_err)

                    return {
                        "query": query,
                        "timeframe_days": days,
                        "videos": [
                            {
                                "title": v.get("title"),
                                "channel": v.get("channel_title"),
                                "views": stats_map.get(v.get("video_id"), {}).get("view_count", 0),
                                "url": f"https://www.youtube.com/watch?v={v.get('video_id')}" if v.get("video_id") else None,
                                "published_at": v.get("published_at"),
                            }
                            for v in vids[:4]
                        ],
                    }
                except Exception as err:
                    logger.warning("YouTube live search failed: %s", err)
                    return {"status": "unavailable", "message": f"YouTube search error: {str(err)}"}

            return {"error": f"Unknown tool: {tool_name}"}

        except Exception as exc:
            logger.exception("Tool execution failed for %s: %s", tool_name, exc)
            return {"error": str(exc)}
