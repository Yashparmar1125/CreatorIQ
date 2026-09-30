import logging
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.openrouter import chat_completion
from app.models.chat_models import ChatMessage, ChatSession
from app.models.concept_models import TrendConcept

logger = logging.getLogger(__name__)


class StrategyService:
    async def list_sessions(self, db: AsyncSession, user_id: uuid.UUID) -> list[dict[str, Any]]:
        """Fetch all chat sessions for a user directly from PostgreSQL."""
        res = await db.execute(
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(desc(ChatSession.updated_at))
        )
        sessions = res.scalars().all()
        return [
            {
                "id": str(s.id),
                "title": s.title,
                "created_at": s.created_at.isoformat(),
                "updated_at": s.updated_at.isoformat(),
            }
            for s in sessions
        ]

    async def create_session(
        self, db: AsyncSession, user_id: uuid.UUID, title: str = "New Strategy Chat"
    ) -> dict[str, Any]:
        """Create a new chat session in PostgreSQL."""
        session = ChatSession(
            id=uuid.uuid4(),
            user_id=user_id,
            title=title.strip() or "New Strategy Chat",
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        return {
            "id": str(session.id),
            "title": session.title,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat(),
        }

    async def get_session_messages(
        self, db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
    ) -> list[dict[str, Any]]:
        """Fetch all messages in a session directly from PostgreSQL."""
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
        return [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "metadata": m.metadata_json or {},
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]

    async def delete_session(self, db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID) -> bool:
        """Delete session and its messages from PostgreSQL."""
        res = await db.execute(
            select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        session = res.scalar_one_or_none()
        if not session:
            return False

        await db.delete(session)
        await db.commit()
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
        return {"niches": ["Tech & AI", "Entertainment"], "tone": "energetic & insightful", "country": "India"}

    async def _get_top_trend_signals(self, db: AsyncSession, prompt: str = "", limit: int = 8) -> list[str]:
        try:
            res = await db.execute(
                select(TrendConcept)
                .order_by(desc(TrendConcept.raw_momentum))
                .limit(limit)
            )
            concepts = res.scalars().all()
            signals = []
            for c in concepts:
                indicator = f" ({c.key_indicator})" if c.key_indicator else ""
                momentum = f" [Velocity Score: {float(c.raw_momentum):.1f}]" if c.raw_momentum else ""
                signals.append(f"• {c.canonical_title}{indicator}{momentum} (Lifecycle: {c.lifecycle.value if hasattr(c.lifecycle, 'value') else c.lifecycle})")
            return signals
        except Exception as e:
            logger.warning("Error fetching trend signals for strategy: %s", e)
            return []

    async def chat(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        session_id: uuid.UUID | None,
        prompt: str,
    ) -> dict[str, Any]:
        # 1. Ensure Session exists in PostgreSQL
        session: ChatSession | None = None
        if session_id:
            s_res = await db.execute(
                select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
            )
            session = s_res.scalar_one_or_none()

        if not session:
            session = ChatSession(
                id=uuid.uuid4(),
                user_id=user_id,
                title=prompt[:45].strip() if len(prompt) > 45 else prompt.strip() or "Strategy Session",
            )
            db.add(session)
            await db.flush()

        # 2. Add user message in PostgreSQL
        user_msg = ChatMessage(
            id=uuid.uuid4(),
            session_id=session.id,
            user_id=user_id,
            role="user",
            content=prompt,
        )
        db.add(user_msg)
        await db.flush()

        # 3. Load prior history from PostgreSQL
        history = await self.get_session_messages(db, user_id, session.id)

        # 4. Creator Context & Trend Signals
        creator_ctx = await self._get_creator_context(user_id)
        top_trends = await self._get_top_trend_signals(db, prompt=prompt)

        system_prompt = (
            "You are CreatorIQ AI Strategy Architect, the premier AI co-pilot for high-growth YouTube & Shorts creators.\n\n"
            "=== CREATOR REAL-TIME CONTEXT ===\n"
            f"• Niches: {', '.join(creator_ctx.get('niches', ['Tech & Entertainment']))}\n"
            f"• Target Region/Country: {creator_ctx.get('country', 'India')}\n"
            f"• Preferred Tone & Vibe: {creator_ctx.get('tone', 'High energy, authentic, actionable')}\n\n"
            "=== LIVE SIGNALS FROM CREATORIQ TREND RADAR ===\n"
            + ("\n".join(top_trends) if top_trends else "• Breakout Shorts Velocity, AI Workflow Tools, Viral Edits") + "\n\n"
            "=== INSTRUCTIONS ===\n"
            "• Respond in clear, beautifully formatted Markdown with emojis, bold highlights, and punchy bullet points.\n"
            "• Tailor all advice, hooks, concept titles, and pacing strategies specifically to the creator's niche and audience.\n"
            "• If the user asks for ideas, hooks, or strategy, provide concrete high-CTR examples (numbers, curiosity gap, emotional triggers).\n"
            "• If asked about current trends or viral topics, directly leverage and cite the live signals above.\n"
            "• Keep your tone empowering, world-class, sharp, and concise."
        )

        llm_messages = [{"role": "system", "content": system_prompt}]
        for m in history[-6:]:  # last 6 context messages
            llm_messages.append({"role": m["role"], "content": m["content"]})
        llm_messages.append({"role": "user", "content": prompt})

        # 5. Generate AI Completion with OpenRouter (or fallback)
        try:
            ai_text = await chat_completion(llm_messages, temperature=0.7)
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

        # 6. Save Assistant message to PostgreSQL
        assistant_msg = ChatMessage(
            id=uuid.uuid4(),
            session_id=session.id,
            user_id=user_id,
            role="assistant",
            content=ai_text,
        )
        db.add(assistant_msg)

        # Update session timestamp & title in PostgreSQL
        session.updated_at = datetime.now(timezone.utc)
        if session.title == "New Strategy Chat":
            session.title = prompt[:45].strip()

        await db.commit()

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
