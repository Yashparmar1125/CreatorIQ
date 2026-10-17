import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.tool_registry import AGENT_TOOLS, ToolRegistry
from app.core.config import settings
from app.core.llm_router import llm_router
from app.models.chat_models import AgentToolCallLog, ChatMessage, ChatSession
from app.repositories.memory_repository import MemoryRepository

logger = logging.getLogger(__name__)

CONVERSATIONAL_GREETINGS = {"hi", "hello", "hey", "hii", "hiii", "yo", "sup", "thanks", "thank you"}


class CopilotAgent:
    def __init__(self) -> None:
        self.tool_registry = ToolRegistry()
        self.memory_repo = MemoryRepository()

    async def run_chat_stream(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        session_id: uuid.UUID | None,
        prompt: str,
        creator_context: dict[str, Any],
        *,
        active_connectors: list[str] | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Executes autonomous Copilot agent loop and yields real-time Server-Sent Events (SSE).
        Events emitted:
          data: {"type": "session", "session_id": "..."}
          data: {"type": "step", "tool": "...", "label": "...", "summary": "...", "status": "running|done"}
          data: {"type": "card", "card_type": "trend|video|connector", "payload": {...}}
          data: {"type": "token", "delta": "..."}
          data: {"type": "done", "message_id": "..."}
        """
        # 1. Session Setup
        session = None
        if session_id:
            s_res = await db.execute(
                select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
            )
            session = s_res.scalar_one_or_none()

        if not session:
            session = ChatSession(
                id=uuid.uuid4(),
                user_id=user_id,
                title=prompt[:42].strip() if len(prompt) > 42 else prompt.strip() or "Strategy Session",
            )
            db.add(session)
            await db.flush()

        yield f"data: {json.dumps({'type': 'session', 'session_id': str(session.id)})}\n\n"

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

        # 3. Conversational Fast-Path (No tools for 'hi', 'thanks', etc.)
        norm_prompt = prompt.lower().strip()
        if norm_prompt in CONVERSATIONAL_GREETINGS:
            channel_name = creator_context.get("channel_name")
            greeting = (
                f"Hey {channel_name}! Ready to analyze your channel performance or find your next breakout video topic?"
                if channel_name
                else "Hey! Ready to uncover high-opportunity YouTube trends or map out your next video blueprint? What topic are you exploring?"
            )
            for word in greeting.split(" "):
                yield f"data: {json.dumps({'type': 'token', 'delta': word + ' '})}\n\n"
                await asyncio.sleep(0.02)

            asst_msg = ChatMessage(
                id=uuid.uuid4(),
                session_id=session.id,
                user_id=user_id,
                role="assistant",
                content=greeting,
                metadata_json={"tools_used": []},
            )
            db.add(asst_msg)
            session.updated_at = datetime.now(timezone.utc)
            await db.commit()
            yield f"data: {json.dumps({'type': 'done', 'message_id': str(asst_msg.id)})}\n\n"
            return

        # 4. Context & Long-Term Memory Assembly
        memories = await self.memory_repo.get_user_memories(db, user_id, limit=10)
        memory_bullets = (
            "\n".join([f"• [{m['category']}] {m['key']}: {m['value']}" for m in memories])
            if memories
            else "None recorded yet."
        )

        niches = ", ".join(creator_context.get("niches") or ["General"])
        channel_desc = (
            f"{creator_context.get('channel_name')} ({creator_context.get('subscriber_count', 0):,} subscribers)"
            if creator_context.get("channel_name")
            else "Unconnected channel (relying on manual profile)"
        )

        system_prompt = (
            "You are CreatorIQ Copilot, an elite AI YouTube strategist and real-time research assistant.\n\n"
            "=== CREATOR PROFILE & PREFERENCES ===\n"
            f"• Channel: {channel_desc}\n"
            f"• Niches: {niches}\n"
            f"• Target Region: {creator_context.get('country', 'India')}\n"
            f"• Preferred Tone: {creator_context.get('tone', 'High energy, authentic, actionable')}\n\n"
            "=== PERSISTENT CREATOR MEMORY (PREFERENCES & RULES) ===\n"
            f"{memory_bullets}\n\n"
            "=== GUIDELINES ===\n"
            "1. ALWAYS cite concrete evidence from real data: mention Reach Multipliers (e.g. '14x baseline'), small channel wins, and optimal windows.\n"
            "2. Never make up fake data or generic templates. If you don't have fresh proof, call the search tools to gather real videos.\n"
            "3. If the creator shares a new preference (e.g. 'I only make Shorts' or 'my audience hates theory'), call the `remember` tool to store it.\n"
            "4. Format answers in structured, clean Markdown with bullet points, high-CTR titles, and clear verdicts. When recommending video topics or content concepts, structure each distinct concept starting with '### Priority N: [Topic Title]' (e.g. ### Priority 1: AI Tools) with:\n"
            "   - **Statistical Evidence:** Virality Probability % (e.g. 92%), Current Momentum Score (e.g. 92/100), Reach Multiplier (e.g. 12.0x baseline), Optimal Window (e.g. Next 3–5 Days)\n"
            "   - **Target Audience & Demand:** Core pain point and emotional trigger\n"
            "   - **Educational / Shorts Blueprint:** Title Idea 1, Title Idea 2, Visual Hook [0-3s], Opening Audio Hook / Dialogue, Retention Pacing [0-3s, 3-15s, 15-45s, 45-60s]\n"
            "5. EFFICIENCY: Call at most 1 to 2 targeted tools. As soon as you gather data from search_trends, search_web, or YouTube, STOP calling tools and synthesize your strategic recommendations.\n"
        )

        # 5. Load Session History (Rolling 10 turns)
        hist_res = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id, ChatMessage.id != user_msg.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(10)
        )
        recent_history = list(reversed(hist_res.scalars().all()))

        messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]
        for m in recent_history:
            messages.append({"role": m.role, "content": m.content})
        messages.append({"role": "user", "content": prompt})

        # Filter tools based on active connectors
        active_tools = list(AGENT_TOOLS)
        executed_tools_metadata = []

        # 6. Autonomous Multi-Turn Agent Loop (Max 4 rounds)
        final_text = ""
        last_provider = "groq"
        last_model = "openai/gpt-oss-20b"

        for round_idx in range(4):
            t0 = time.perf_counter()

            if len(executed_tools_metadata) >= 2 or round_idx >= 2:
                messages.append({
                    "role": "user",
                    "content": "You have gathered sufficient evidence. Synthesize your final strategic recommendation directly. Present 3 title angles, reach evidence, and next steps in clean markdown. Do not call any further tools."
                })

            response = await llm_router.chat(messages, tools=active_tools, temperature=0.6)
            tool_calls = response.get("tool_calls")
            content = (response.get("content") or "").strip()
            last_provider = response.get("provider", "groq")
            last_model = response.get("model", "openai/gpt-oss-20b")

            if content and (not tool_calls or len(executed_tools_metadata) >= 2):
                final_text = content
                break

            if not tool_calls:
                final_text = content
                break

            # Append assistant message with tool calls to conversation trajectory
            messages.append({
                "role": "assistant",
                "content": response.get("content") or None,
                "tool_calls": tool_calls,
            })

            # Execute tool calls
            for tc in tool_calls:
                fn = tc.get("function", {})
                name = fn.get("name")
                call_id = tc.get("id")
                try:
                    args = json.loads(fn.get("arguments", "{}"))
                except Exception:
                    args = {}

                step_label = name.replace("_", " ").title()
                summary = f"Querying {step_label} for '{args.get('query') or args.get('niche') or args.get('trend_id_or_topic') or 'channel'}'"

                yield f"data: {json.dumps({'type': 'step', 'tool': name, 'label': step_label, 'summary': summary, 'status': 'running'})}\n\n"

                t_exec_start = time.perf_counter()
                tool_result = await self.tool_registry.execute(
                    db,
                    user_id=user_id,
                    tool_name=name,
                    arguments=args,
                    creator_context=creator_context,
                )
                duration_ms = int((time.perf_counter() - t_exec_start) * 1000)

                # Log tool execution to database
                db.add(
                    AgentToolCallLog(
                        id=uuid.uuid4(),
                        user_id=user_id,
                        session_id=session.id,
                        tool_name=name,
                        args_json=args,
                        duration_ms=duration_ms,
                        provider_model=last_model,
                        success="error" not in tool_result,
                    )
                )

                executed_tools_metadata.append({
                    "tool": name,
                    "label": step_label,
                    "summary": summary,
                    "duration_ms": duration_ms,
                    "data": tool_result,
                })

                yield f"data: {json.dumps({'type': 'step', 'tool': name, 'label': step_label, 'summary': summary, 'duration_ms': duration_ms, 'status': 'done'})}\n\n"

                # Check if tool result has rich cards to surface immediately
                if name == "search_trends" and tool_result.get("trends"):
                    for tr in tool_result["trends"][:2]:
                        yield f"data: {json.dumps({'type': 'card', 'card_type': 'trend', 'payload': tr})}\n\n"
                elif name == "find_small_channel_outliers" and tool_result.get("outlier_videos"):
                    for ov in tool_result["outlier_videos"][:2]:
                        yield f"data: {json.dumps({'type': 'card', 'card_type': 'video', 'payload': ov})}\n\n"
                elif name == "search_youtube_live" and tool_result.get("videos"):
                    for yv in tool_result["videos"][:2]:
                        yield f"data: {json.dumps({'type': 'card', 'card_type': 'video', 'payload': yv})}\n\n"

                # Append tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": call_id,
                    "name": name,
                    "content": json.dumps(tool_result),
                })

        # If final_text is still empty after loop, fallback to Gemini synthesis
        if not final_text:
            try:
                gemini_resp = await llm_router.chat(messages, prefer_provider="gemini", temperature=0.6)
                final_text = (gemini_resp.get("content") or "").strip()
                last_provider = "gemini"
                last_model = "gemini-3.8-flash"
            except Exception as g_err:
                logger.warning("Gemini synthesis fallback failed: %s", g_err)

        if not final_text:
            final_text = "I researched the live trends and market signals for your topic. Review the research steps and cards above for details."

        # Stream the final text chunks
        chunk_size = 4
        words = final_text.split(" ")
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i : i + chunk_size]) + " "
            yield f"data: {json.dumps({'type': 'token', 'delta': chunk})}\n\n"
            await asyncio.sleep(0.015)

        asst_msg = ChatMessage(
            id=uuid.uuid4(),
            session_id=session.id,
            user_id=user_id,
            role="assistant",
            content=final_text,
            metadata_json={
                "tools_used": executed_tools_metadata,
                "provider": last_provider,
                "model": last_model,
            },
        )
        db.add(asst_msg)
        session.updated_at = datetime.now(timezone.utc)
        if session.title == "New Strategy Chat" or session.title == "Strategy Session":
            session.title = prompt[:42].strip()
        await db.commit()

        yield f"data: {json.dumps({'type': 'done', 'message_id': str(asst_msg.id)})}\n\n"
        return
