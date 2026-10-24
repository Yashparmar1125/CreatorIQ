import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, AsyncGenerator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.tool_registry import AGENT_TOOLS, ToolRegistry
from app.core.config import settings
from app.core.db import SessionLocal
from app.core.llm_router import llm_router
from app.models.chat_models import AgentToolCallLog, ChatMessage, ChatSession
from app.repositories.memory_repository import MemoryRepository

logger = logging.getLogger(__name__)

CONVERSATIONAL_GREETINGS = {"hi", "hello", "hey", "hii", "hiii", "yo", "sup", "thanks", "thank you"}

# Tool -> connector id. Tools that read the creator's own profile, memory or
# CreatorIQ's internal trend catalog are always available natively.
_TOOL_CONNECTORS: dict[str, str] = {
    "search_youtube_live": "youtube",
    "get_channel_outliers": "youtube",
    "get_calendar_schedule": "calendar",
    "schedule_content_milestone": "calendar",
}
_ALWAYS_AVAILABLE_TOOLS = {
    "get_my_channel",
    "remember",
    "recall",
    "get_my_saved_trends",
    "search_trends",
    "get_trend_detail",
    "find_small_channel_outliers",
    "search_web",
}


def _filter_tools_by_connectors(
    tools: list[dict[str, Any]], active_connectors: list[str] | None
) -> list[dict[str, Any]]:
    """Restrict the agent tool set to the connectors the client enabled."""
    if not active_connectors:
        return [
            t for t in tools if t["function"]["name"] in _ALWAYS_AVAILABLE_TOOLS
        ]

    allowed = set(active_connectors)
    return [
        t
        for t in tools
        if t["function"]["name"] in _ALWAYS_AVAILABLE_TOOLS
        or _TOOL_CONNECTORS.get(t["function"]["name"]) in allowed
    ]


def _compact_tool_result_for_llm(tool_result: dict[str, Any], max_chars: int = 2400) -> str:
    """Compact tool output JSON so we stay well below Groq's 8K TPM ceiling."""
    raw = json.dumps(tool_result, ensure_ascii=False)
    if len(raw) <= max_chars:
        return raw
    return raw[:max_chars] + "...(truncated)"


class CopilotAgent:
    def __init__(self) -> None:
        self.tool_registry = ToolRegistry()
        self.memory_repo = MemoryRepository()

    async def _extract_and_save_memories_bg(
        self,
        user_id: uuid.UUID,
        user_prompt: str,
        assistant_reply: str,
    ) -> None:
        """
        ChatGPT/Claude-style silent background memory extraction.
        Detects when the creator reveals a preference, active video project, filming constraint,
        or style rule and persists it into `creator_memory` without blocking the chat stream.
        """
        if len(user_prompt.strip()) < 12:
            return
        try:
            extraction_messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a silent memory extractor for a YouTube creator copilot.\n"
                        "Inspect the user's message. If the user reveals any lasting personal preference, "
                        "active video project they are working on, filming/publishing schedule preference, "
                        "format constraint, or topic they want to avoid, output a JSON array of objects:\n"
                        '[{"category": "preference|project|schedule|style|avoid", "key": "short_snake_key", "value": "concise fact"}]\n'
                        "If no new personal fact, project decision, or preference is stated by the user, output ONLY `[]`.\n"
                        "Do not output markdown fences or explanations—only valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": f"User message: {user_prompt[:800]}\nAssistant summary: {assistant_reply[:400]}",
                },
            ]
            resp = await llm_router.chat(extraction_messages, temperature=0.1, prefer_provider="gemini")
            raw_content = (resp.get("content") or "").strip()
            if not raw_content or raw_content == "[]":
                return
            # Strip optional markdown code fences
            if raw_content.startswith("```"):
                raw_content = raw_content.strip("`").removeprefix("json").strip()
            items = json.loads(raw_content)
            if not isinstance(items, list) or not items:
                return

            async with SessionLocal() as bg_db:
                for item in items[:3]:
                    if isinstance(item, dict) and item.get("key") and item.get("value"):
                        await self.memory_repo.upsert_memory(
                            bg_db,
                            user_id=user_id,
                            category=str(item.get("category") or "preference")[:64],
                            key=str(item["key"])[:120],
                            value=str(item["value"])[:500],
                            confidence=0.95,
                        )
                await bg_db.commit()
        except Exception as e:
            logger.debug("Silent background memory extraction skipped: %s", e)

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

        # 3. Conversational Fast-Path (Natural, connected greeting)
        norm_prompt = prompt.lower().strip()
        if norm_prompt in CONVERSATIONAL_GREETINGS:
            channel_name = creator_context.get("channel_name")
            dash_trends = creator_context.get("dashboard_trends") or []
            top_topic = dash_trends[0].get("topic") if dash_trends else None
            if channel_name and top_topic:
                greeting = (
                    f"Hey {channel_name}! Good to see you. I have your latest channel context loaded—"
                    f"and I noticed **{top_topic}** is sitting at the top of your opportunity feed right now. "
                    f"Want to break down an angle for that, work on a script, or check your schedule?"
                )
            elif channel_name:
                greeting = (
                    f"Hey {channel_name}! I have your channel profile and recent outliers loaded. "
                    f"What are we building today—brainstorming your next video, tightening a hook, or planning your upload schedule?"
                )
            else:
                greeting = (
                    "Hey! What are we working on today—exploring a video idea, sharpening a title and hook, or mapping out your content schedule?"
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

        # 4. Living Creator Context Graph Assembly
        ist = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(ist)
        upcoming_days_map = ", ".join(
            [
                f"{(now_ist + timedelta(days=d)).strftime('%A %b %d, %Y')} ({(now_ist + timedelta(days=d)).strftime('%Y-%m-%d')})"
                for d in range(1, 8)
            ]
        )

        memories = await self.memory_repo.get_user_memories(db, user_id, limit=15)
        memory_bullets = (
            "\n".join([f"• [{m['category']}] {m['key']}: {m['value']}" for m in memories])
            if memories
            else "None recorded yet."
        )

        niches = ", ".join(creator_context.get("niches") or ["General"])
        channel_name = creator_context.get("channel_name")
        handle = creator_context.get("handle")
        sub_count = creator_context.get("subscriber_count", 0)
        is_oauth_connected = creator_context.get("is_oauth_connected", False)

        channel_desc = (
            f"{channel_name} ({handle or ''}, {sub_count:,} subscribers) [Connected YouTube Channel]"
            if is_oauth_connected and channel_name
            else f"{channel_name} ({sub_count:,} subscribers)"
            if channel_name
            else "Manual Creator Profile"
        )

        reach_ratio = float(creator_context.get("median_reach_ratio") or 0.35)
        dominant_traffic = str(creator_context.get("dominant_traffic_source") or "browse")
        speech_tempo = int(creator_context.get("speech_tempo_wpm") or 155)
        retention_30s = float(creator_context.get("median_retention_30s_pct") or 55.0)
        outliers = creator_context.get("top_outliers", [])
        outliers_summary = (
            "; ".join(
                [
                    f"\"{o.get('title')}\" ({o.get('reach_ratio')}x reach ratio, {o.get('view_count', 0):,} views)"
                    for o in outliers[:3]
                ]
            )
            if outliers
            else "No historical outlier videos indexed yet."
        )

        # Dashboard Top 5 Trends & Saved Trends
        dash_trends = creator_context.get("dashboard_trends") or []
        dash_trends_summary = (
            "\n".join(
                [
                    f"  {t.get('rank')}. \"{t.get('topic')}\" (Score: {t.get('opportunity_score')}, Status: {t.get('lifecycle')}) — {t.get('why_predicted')}"
                    for t in dash_trends
                ]
            )
            if dash_trends
            else "  None loaded."
        )
        saved_trends = creator_context.get("saved_trends") or []
        saved_summary = ", ".join([f'"{s}"' for s in saved_trends]) if saved_trends else "None saved yet."

        # Cross-session episodic continuity
        episodic_notes = creator_context.get("recent_sessions_summary") or []
        episodic_summary = (
            "\n".join([f"  • {note}" for note in episodic_notes])
            if episodic_notes
            else "  No prior chat sessions."
        )

        system_prompt = (
            "You are CreatorIQ Copilot—a sharp, deeply personal YouTube Executive Producer and creative partner "
            "with the conversational intelligence of Claude and ChatGPT.\n"
            "You know this creator, their channel, their best-performing videos, their active dashboard trends, "
            "and their past conversations intimately.\n\n"
            "=== LIVE TEMPORAL ANCHOR (USE THIS EXACT DATE/TIME) ===\n"
            f"• Current Date & Time (IST): {now_ist.strftime('%A, %B %d, %Y at %I:%M %p IST')} ({now_ist.isoformat()})\n"
            f"• Next 7 Days Calendar Reference: {upcoming_days_map}\n"
            "• NEVER hallucinate past years like 2024 or 2025. Always anchor schedules and deadlines to the live 2026 dates above.\n\n"
            "=== WHO YOU ARE WORKING WITH (LIVE CREATOR CONTEXT) ===\n"
            f"• Channel: {channel_desc}\n"
            f"• Core Niches: {niches}\n"
            f"• Audience Geography: {creator_context.get('country', 'India')} (Peak publish window: 6:00 PM – 9:00 PM IST)\n"
            f"• Creator Tone & Style: {creator_context.get('tone', 'Direct, analytical, high-conviction')}\n"
            f"• Performance DNA: {reach_ratio:.2f}x median reach ratio | Primarily {dominant_traffic} traffic | "
            f"~{speech_tempo} WPM speaking pace | ~{retention_30s:.0f}% 30s hook hold\n"
            f"• Proven Channel Outliers: {outliers_summary}\n\n"
            "=== CREATOR'S LIVE DASHBOARD & SAVED OPPORTUNITIES ===\n"
            f"• Current Top Ranked Opportunities on Dashboard:\n{dash_trends_summary}\n"
            f"• Creator's Saved Trends: {saved_summary}\n\n"
            "=== PERSISTENT CREATOR MEMORY & RECENT CONVERSATIONS ===\n"
            f"• Remembered Preferences & Projects:\n{memory_bullets}\n"
            f"• Recent Cross-Session Continuity:\n{episodic_summary}\n\n"
            "=== HOW TO THINK & RESPOND (INTENT-ADAPTIVE INTELLIGENCE) ===\n"
            "CRITICAL RULE: Match your response format, length, and tone to what the creator actually asked for. "
            "NEVER dump a generic 3-title strategy table when the user asks a specific question, asks to schedule something, or wants a quick iteration.\n\n"
            "1. WHEN ASKED TO SCHEDULE OR CHECK CALENDAR (e.g. 'schedule this', 'book this video', 'when am I free?'):\n"
            "   • Immediately call `schedule_content_milestone` (or `get_calendar_schedule`).\n"
            "   • If the user didn't specify a date/time, pick the next optimal evening slot (e.g., tomorrow or the next weekday at 19:30 IST: "
            f"`{(now_ist + timedelta(days=1)).strftime('%Y-%m-%d')}T19:30:00+05:30`).\n"
            "   • If `schedule_content_milestone` succeeds (`scheduled: true`), reply with a warm, concise confirmation showing the booked title, exact IST date/time, and the clickable Google Calendar link (`html_link`). Then offer 1 relevant follow-up (e.g. 'Want me to block a filming or script slot 2 days before this?').\n"
            "   • If `schedule_content_milestone` fails (`scheduled: false`), state the exact error clearly and honestly.\n\n"
            "2. WHEN SPARRING, BRAINSTORMING, OR ITERATING ON A SPECIFIC PART (e.g. 'write the hook', 'make this title punchier', 'what do you think of this idea?'):\n"
            "   • Answer directly and conversationally like an elite co-writer.\n"
            "   • Ground your feedback naturally in their real channel context (e.g. reference why their Suzlon video worked, or pace the script to their natural speaking rhythm) WITHOUT reciting robotic formulas.\n\n"
            "3. WHEN ASKED FOR A FULL VIDEO STRATEGY OR TOPIC RESEARCH:\n"
            "   • Use your tools (`search_trends`, `search_youtube_live`, `find_small_channel_outliers`, or `search_web`) when live evidence helps.\n"
            "   • Deliver a sharp, cohesive strategy: Why this angle fits their channel right now, 3 high-conviction title + thumbnail pairs, a tight opening hook (0–30s visual proof + curiosity gap), and a clear outline.\n\n"
            "4. ZERO ROBOTIC JARGON:\n"
            "   • Never print internal prompt labels like `CNCS =`, `BROWSE-dominant`, `155 WPM →`, or disclaimer footnotes like `*Projected multipliers are conservative estimates...`.\n"
            "   • Speak naturally, incisively, and personally—like a trusted human producer who has worked with this creator for years.\n"
        )

        # 5. Load Session History (Rolling 8 turns to keep context sharp & within TPM limits)
        hist_res = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id, ChatMessage.id != user_msg.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(8)
        )
        recent_history = list(reversed(hist_res.scalars().all()))

        messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]
        for m in recent_history:
            # Trim overly long historical assistant replies to preserve token budget
            hist_content = m.content if len(m.content) <= 2200 else m.content[:2200] + "\n...(trimmed)"
            messages.append({"role": m.role, "content": hist_content})
        messages.append({"role": "user", "content": prompt})

        active_tools = _filter_tools_by_connectors(AGENT_TOOLS, active_connectors)
        executed_tools_metadata = []

        # 6. Autonomous Multi-Turn Agent Loop (Up to 4 rounds, max 3 tool calls)
        final_text = ""
        last_provider = "groq"
        last_model = "openai/gpt-oss-120b"

        for round_idx in range(4):
            if len(executed_tools_metadata) >= 3 or round_idx >= 3:
                messages.append({
                    "role": "user",
                    "content": (
                        "Respond directly to the creator's request using the tool results above. "
                        "Keep your response natural, accurate to the tool outputs, and tailored to their intent. "
                        "Do not call any more tools."
                    ),
                })

            response = await llm_router.chat(messages, tools=active_tools, temperature=0.55)
            tool_calls = response.get("tool_calls")
            content = (response.get("content") or "").strip()
            last_provider = response.get("provider", "groq")
            last_model = response.get("model", "openai/gpt-oss-120b")

            if content and (not tool_calls or len(executed_tools_metadata) >= 3):
                final_text = content
                break

            if not tool_calls:
                final_text = content
                break

            messages.append({
                "role": "assistant",
                "content": response.get("content") or None,
                "tool_calls": tool_calls,
            })

            for tc in tool_calls:
                fn = tc.get("function", {})
                name = fn.get("name")
                call_id = tc.get("id")
                try:
                    args = json.loads(fn.get("arguments", "{}"))
                except Exception:
                    args = {}

                step_label = name.replace("_", " ").title()
                target_label = (
                    args.get("title")
                    or args.get("query")
                    or args.get("niche")
                    or args.get("trend_id_or_topic")
                    or ("calendar" if "calendar" in name or "schedule" in name else "channel")
                )
                summary = (
                    f"Scheduling '{args.get('title')}' on Google Calendar"
                    if name == "schedule_content_milestone" and args.get("title")
                    else f"Checking Google Calendar schedule ({args.get('days_ahead', 14)} days)"
                    if name == "get_calendar_schedule"
                    else f"Saving preference '{args.get('key', '')}' to Creator Memory"
                    if name == "remember"
                    else f"Querying {step_label} for '{target_label}'"
                )

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

                if name == "search_trends" and tool_result.get("trends"):
                    for tr in tool_result["trends"][:2]:
                        yield f"data: {json.dumps({'type': 'card', 'card_type': 'trend', 'payload': tr})}\n\n"
                elif name == "find_small_channel_outliers" and tool_result.get("outlier_videos"):
                    for ov in tool_result["outlier_videos"][:2]:
                        yield f"data: {json.dumps({'type': 'card', 'card_type': 'video', 'payload': ov})}\n\n"
                elif name == "search_youtube_live" and tool_result.get("videos"):
                    for yv in tool_result["videos"][:2]:
                        yield f"data: {json.dumps({'type': 'card', 'card_type': 'video', 'payload': yv})}\n\n"
                elif name == "schedule_content_milestone" and tool_result.get("scheduled") and tool_result.get("event"):
                    yield f"data: {json.dumps({'type': 'card', 'card_type': 'calendar', 'payload': tool_result['event']})}\n\n"

                messages.append({
                    "role": "tool",
                    "tool_call_id": call_id,
                    "name": name,
                    "content": _compact_tool_result_for_llm(tool_result),
                })

        if not final_text:
            try:
                gemini_resp = await llm_router.chat(messages, prefer_provider="gemini", temperature=0.55)
                final_text = (gemini_resp.get("content") or "").strip()
                last_provider = "gemini"
                last_model = "gemini-3.8-flash"
            except Exception as g_err:
                logger.warning("Gemini synthesis fallback failed: %s", g_err)

        if not final_text:
            final_text = "I completed the action above. Let me know how you'd like to build on this next."

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

        # Fire silent post-turn background memory extraction (ChatGPT-style automatic personalization)
        asyncio.create_task(self._extract_and_save_memories_bg(user_id, prompt, final_text))

        yield f"data: {json.dumps({'type': 'done', 'message_id': str(asst_msg.id)})}\n\n"
        return
