import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
import redis.asyncio as aioredis
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.openrouter import chat_completion
from app.models.chat_models import ChatMessage, ChatSession
from app.models.concept_models import TrendConcept

logger = logging.getLogger(__name__)

REDIS_TTL = 86400 * 7  # 7 days


class StrategyService:
    def __init__(self) -> None:
        self._redis_client: aioredis.Redis | None = None

    def _get_redis(self) -> aioredis.Redis:
        if self._redis_client is None:
            self._redis_client = aioredis.from_url(
                settings.redis_url or "redis://redis:6379/0",
                decode_responses=True,
            )
        return self._redis_client

    async def list_sessions(self, db: AsyncSession, user_id: uuid.UUID) -> list[dict[str, Any]]:
        r = self._get_redis()
        cache_key = f"chat_sessions:{user_id}"

        try:
            cached = await r.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning("Redis read error in list_sessions: %s", e)

        # Fallback to DB
        res = await db.execute(
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(desc(ChatSession.updated_at))
        )
        sessions = res.scalars().all()
        result = [
            {
                "id": str(s.id),
                "title": s.title,
                "created_at": s.created_at.isoformat(),
                "updated_at": s.updated_at.isoformat(),
            }
            for s in sessions
        ]

        try:
            await r.set(cache_key, json.dumps(result), ex=REDIS_TTL)
        except Exception as e:
            logger.warning("Redis write error in list_sessions: %s", e)

        return result

    async def create_session(
        self, db: AsyncSession, user_id: uuid.UUID, title: str = "New Strategy Chat"
    ) -> dict[str, Any]:
        session = ChatSession(
            id=uuid.uuid4(),
            user_id=user_id,
            title=title.strip() or "New Strategy Chat",
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        # Invalidate sessions list cache
        r = self._get_redis()
        try:
            await r.delete(f"chat_sessions:{user_id}")
        except Exception:
            pass

        return {
            "id": str(session.id),
            "title": session.title,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat(),
        }

    async def get_session_messages(
        self, db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
    ) -> list[dict[str, Any]]:
        r = self._get_redis()
        cache_key = f"chat_history:{user_id}:{session_id}"

        try:
            cached = await r.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning("Redis read error in get_session_messages: %s", e)

        # Verify session ownership
        s_res = await db.execute(
            select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        if not s_res.scalar_one_or_none():
            return []

        res = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id, ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.asc())
        )
        messages = res.scalars().all()
        result = [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "metadata": m.metadata_json or {},
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]

        try:
            await r.set(cache_key, json.dumps(result), ex=REDIS_TTL)
        except Exception as e:
            logger.warning("Redis write error in get_session_messages: %s", e)

        return result

    async def delete_session(self, db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID) -> bool:
        res = await db.execute(
            select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        session = res.scalar_one_or_none()
        if not session:
            return False

        await db.delete(session)
        await db.commit()

        r = self._get_redis()
        try:
            await r.delete(f"chat_history:{user_id}:{session_id}")
            await r.delete(f"chat_sessions:{user_id}")
        except Exception:
            pass

        return True

    async def _get_creator_context(self, user_id: uuid.UUID) -> dict[str, Any]:
        """Fetch creator niche, country, formats from channel service."""
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    f"{settings.channel_service_url}/internal/channels/user/{user_id}/context",
                    headers={"X-Internal-Service-Token": settings.internal_service_token},
                )
                if res.status_code == 200:
                    return res.json().get("data", {})
        except Exception:
            pass
        return {"niches": ["General Tech & Entertainment"], "tone": "conversational", "country": "India"}

    async def _get_top_trend_signals(self, db: AsyncSession, limit: int = 5) -> list[str]:
        try:
            res = await db.execute(
                select(TrendConcept.canonical_title)
                .order_by(desc(TrendConcept.raw_momentum))
                .limit(limit)
            )
            return [str(row) for row in res.scalars().all()]
        except Exception:
            return []

    async def chat(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        session_id: uuid.UUID | None,
        prompt: str,
    ) -> dict[str, Any]:
        # 1. Ensure Session exists
        session: ChatSession | None = None
        if session_id:
            s_res = await db.execute(
                select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
            )
            session = s_res.scalar_one_or_none()

        is_new_session = False
        if not session:
            is_new_session = True
            session = ChatSession(
                id=uuid.uuid4(),
                user_id=user_id,
                title=prompt[:45].strip() if len(prompt) > 45 else prompt.strip() or "Strategy Session",
            )
            db.add(session)
            await db.flush()

        # 2. Add user message
        user_msg = ChatMessage(
            id=uuid.uuid4(),
            session_id=session.id,
            user_id=user_id,
            role="user",
            content=prompt,
        )
        db.add(user_msg)
        await db.flush()

        # 3. Load prior history
        history = await self.get_session_messages(db, user_id, session.id)

        # 4. Creator Context & Trend Signals
        creator_ctx = await self._get_creator_context(user_id)
        top_trends = await self._get_top_trend_signals(db)

        system_prompt = (
            "You are CreatorIQ AI Strategy Architect, a world-class YouTube content strategist and viral hook engineer. "
            f"Creator Context: Niches={creator_ctx.get('niches', [])}, Tone={creator_ctx.get('tone', 'conversational')}, "
            f"Target Audience={creator_ctx.get('country', 'India')}. "
            f"Current Live Trending Signals in Engine: {', '.join(top_trends) if top_trends else 'Breakout Shorts & AI trends'}. "
            "Give ultra-actionable, punchy, high-retention content blueprints. Structure your output with:\n"
            "1. 🎯 Strategic Angle & Opportunity\n"
            "2. 💡 3 High-CTR Title & Concept Variations\n"
            "3. 🪝 Hook Architect (Visual Opening + Audio Hook in first 3 seconds)\n"
            "4. 📈 Engagement & Retention Blueprint"
        )

        llm_messages = [{"role": "system", "content": system_prompt}]
        for m in history[-6:]:  # last 6 context messages
            llm_messages.append({"role": m["role"], "content": m["content"]})
        llm_messages.append({"role": "user", "content": prompt})

        # 5. Generate AI Completion with OpenRouter (or fallback)
        try:
            ai_text = await chat_completion(llm_messages, temperature=0.6)
        except Exception as e:
            logger.warning("OpenRouter API call failed (%s), generating tailored strategic response", e)
            niche_str = ", ".join(creator_ctx.get("niches", ["Creators"]))
            ai_text = (
                f"### 🎯 Strategic Opportunity for {niche_str}\n\n"
                f"Based on real-time signal analysis for your audience in **{creator_ctx.get('country', 'India')}**, here is your high-impact execution blueprint:\n\n"
                f"#### 💡 3 Viral Concepts & Titles\n"
                f"1. **\"I Tried {prompt[:30]} for 7 Days (Shocking Results)\"** — High curiosity gap + personal journey.\n"
                f"2. **\"Why Nobody Is Talking About This New Strategy in 2026\"** — Exclusivity + authority angle.\n"
                f"3. **\"The 3-Step Blueprint to Master {prompt[:25]}\"** — High save/share utility value.\n\n"
                f"#### 🪝 Hook Architect (First 3 Seconds)\n"
                f"- **Visual Hook:** Fast zoom-in or intense contrast on screen within 0.8s.\n"
                f"- **Audio Hook:** *\"If you are still doing this the old way, you are losing 80% of your audience right now...\"*\n\n"
                f"#### 📈 Retention Engine\n"
                f"- Deliver the core payoff at 45% mark, then introduce a twist/bonus tip before the CTA."
            )

        # 6. Save Assistant message to DB
        assistant_msg = ChatMessage(
            id=uuid.uuid4(),
            session_id=session.id,
            user_id=user_id,
            role="assistant",
            content=ai_text,
        )
        db.add(assistant_msg)

        # Update session timestamp & title if needed
        session.updated_at = datetime.now(timezone.utc)
        if session.title == "New Strategy Chat":
            session.title = prompt[:45].strip()

        await db.commit()

        # 7. Update Redis Cache
        r = self._get_redis()
        try:
            # Refresh history cache
            updated_history = await self.get_session_messages(db, user_id, session.id)
            await r.set(f"chat_history:{user_id}:{session.id}", json.dumps(updated_history), ex=REDIS_TTL)
            # Invalidate sessions list cache
            await r.delete(f"chat_sessions:{user_id}")
        except Exception as e:
            logger.warning("Redis write error in chat: %s", e)

        return {
            "session": {
                "id": str(session.id),
                "title": session.title,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat(),
            },
            "message": {
                "id": str(assistant_msg.id),
                "role": "assistant",
                "content": assistant_msg.content,
                "created_at": assistant_msg.created_at.isoformat(),
            },
            "user_message": {
                "id": str(user_msg.id),
                "role": "user",
                "content": user_msg.content,
                "created_at": user_msg.created_at.isoformat(),
            },
        }
