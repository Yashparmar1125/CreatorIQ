import json
import re
from typing import Any

import httpx

from app.core.config import settings


async def chat_completion(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.7,
    response_format_json: bool = False,
) -> str:
    """OpenAI-compatible chat completions via OpenRouter."""
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY / openrouter_api_key is not set")

    url = f"{settings.openrouter_base_url.rstrip('/')}/chat/completions"
    headers: dict[str, str] = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }
    if settings.openrouter_http_referer:
        headers["HTTP-Referer"] = settings.openrouter_http_referer
    if settings.openrouter_app_title:
        headers["X-Title"] = settings.openrouter_app_title

    body: dict[str, Any] = {
        "model": settings.llm_model,
        "messages": messages,
        "temperature": temperature,
    }
    if response_format_json:
        body["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()

    if "choices" not in data:
        err = data.get("error") or data
        raise RuntimeError(f"OpenRouter error: {err}")

    content = data["choices"][0]["message"]["content"]
    if not isinstance(content, str):
        raise RuntimeError("Unexpected OpenRouter response shape")
    return content


def _sanitize_topic(topic: str) -> str:
    """Strip hashtags/noise from YouTube titles before prompting the LLM."""
    cleaned = re.sub(r"#\w+", " ", topic)
    cleaned = cleaned.replace("|", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or topic.strip()


def _extract_json(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise ValueError("Expected JSON object")
    return parsed


def _brief_is_empty(brief: dict[str, Any]) -> bool:
    titles = brief.get("titles") or []
    insight = str(brief.get("strategy_insight") or "").strip()
    outline = brief.get("script_outline") or {}
    tags = brief.get("tags") or []
    hook = ""
    retention = ""
    if isinstance(outline, dict):
        hook = str(outline.get("hook") or "").strip()
        retention = str(outline.get("retention_mid") or "").strip()
    return not titles and not insight and not hook and not retention and not tags


def _normalize_brief(data: dict[str, Any], topic: str) -> dict[str, Any]:
    titles_raw = data.get("titles") or data.get("optimized_titles") or []
    titles: list[dict[str, str]] = []
    for item in titles_raw:
        if isinstance(item, str) and item.strip():
            titles.append({"text": item.strip(), "hook_type": "Curiosity"})
        elif isinstance(item, dict):
            text = item.get("text") or item.get("title") or ""
            if str(text).strip():
                titles.append(
                    {
                        "text": str(text).strip(),
                        "hook_type": str(item.get("hook_type") or item.get("angle") or "Custom"),
                    }
                )

    outline = data.get("script_outline") or data.get("outline") or {}
    if isinstance(outline, str):
        script_outline = {
            "hook": outline[:280],
            "retention_mid": "Deliver the core value quickly with pattern interrupts and visual changes.",
            "cta": "Ask viewers to subscribe and comment with their take.",
        }
    elif isinstance(outline, dict):
        sections = outline.get("sections") or []
        retention_mid = (
            outline.get("retention_mid")
            or outline.get("retention")
            or outline.get("mid")
            or ""
        )
        if not retention_mid and sections:
            retention_mid = "; ".join(str(s) for s in sections[:4])
        script_outline = {
            "hook": str(outline.get("hook") or outline.get("intro") or "").strip(),
            "retention_mid": str(retention_mid).strip(),
            "cta": str(outline.get("cta") or outline.get("call_to_action") or "").strip(),
        }
    else:
        script_outline = {"hook": "", "retention_mid": "", "cta": ""}

    tags_raw = data.get("tags") or data.get("seo_tags") or []
    tags = [str(t).lstrip("#").strip() for t in tags_raw if str(t).strip()][:12]

    insight = (
        data.get("strategy_insight")
        or data.get("insight")
        or data.get("strategy")
        or ""
    )

    return {
        "titles": titles,
        "strategy_insight": str(insight).strip(),
        "script_outline": script_outline,
        "tags": tags,
        "source_topic": topic,
    }


def _fallback_brief(topic: str, channel_context: dict) -> dict[str, Any]:
    niche_list = channel_context.get("niches") or []
    niche = ", ".join(niche_list) or "your niche"
    short = topic[:100]
    niche_lower = {n.lower() for n in niche_list}
    if "finance" in niche_lower:
        tags = ["stocks", "investing", "finance", "stockmarket", "nifty", "sensex", "trading", "india"]
        insight = (
            f"This topic fits {niche} channels covering markets and personal finance. "
            "Open with a clear market hook, explain the 'so what' for retail investors, and keep data points simple."
        )
    else:
        tags = ["shorts", "viral", "trending", niche_list[0].lower() if niche_list else "content", "india"]
        insight = (
            f"This topic aligns with {niche} and current short-form momentum. "
            "Lead with a bold visual hook in the first 2 seconds, then deliver one clear payoff."
        )
    return {
        "titles": [
            {"text": f"{short} — what nobody is talking about", "hook_type": "Curiosity gap"},
            {"text": f"I tried {short} so you don't have to", "hook_type": "Story"},
            {"text": f"{short} explained in 60 seconds", "hook_type": "Short-form hook"},
        ],
        "strategy_insight": insight,
        "script_outline": {
            "hook": f"Open on the most surprising or emotional moment related to {short}.",
            "retention_mid": "Explain why it's trending, add your unique creator angle, and keep cuts fast.",
            "cta": "Ask viewers which version they want next — comment to vote.",
        },
        "tags": tags,
        "source_topic": topic,
        "generated_via": "fallback",
    }


async def generate_content_ideas_json(topic: str, channel_context: str = "") -> dict[str, Any]:
    """Returns parsed JSON with key 'ideas': list of {title, angle}."""
    system = (
        "You are a YouTube content strategist. Reply with ONLY valid JSON, no markdown. "
        'Schema: {"ideas": [{"title": string, "angle": string}] } with exactly 3 ideas.'
    )
    user = f"Topic: {topic}\n"
    if channel_context:
        user += f"Channel context: {channel_context}\n"
    user += "Make titles specific and clickable."

    raw = await chat_completion(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.8,
        response_format_json=True,
    )
    return json.loads(raw)


async def generate_titles_and_script(topic: str, *, titles_hint: list[str] | None = None) -> dict[str, Any]:
    """Returns JSON with titles, tags, script_outline (sections)."""
    system = (
        "You are a YouTube creator assistant. Reply with ONLY valid JSON. "
        'Schema: {"titles": [string], "tags": [string], '
        '"script_outline": {"hook": string, "sections": [string], "cta": string} }'
    )
    user = f"Topic: {topic}\n"
    if titles_hint:
        user += f"Preferred title directions: {titles_hint}\n"

    raw = await chat_completion(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.7,
        response_format_json=True,
    )
    return json.loads(raw)


async def generate_tag_list(topic: str, *, max_tags: int = 12) -> list[str]:
    system = 'Reply with ONLY valid JSON: {"tags": [string]}. Tags must be YouTube-style keywords, no #.'
    user = f"Topic: {topic}\nReturn up to {max_tags} tags."
    raw = await chat_completion(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.5,
        response_format_json=True,
    )
    data = json.loads(raw)
    tags = data.get("tags") or []
    return [str(t) for t in tags][:max_tags]


async def generate_video_script(topic: str) -> dict[str, Any]:
    system = (
        "You write YouTube video scripts. Reply with ONLY valid JSON. "
        'Schema: {"full_script": string, "outline": {"hook": string, "sections": [string], "cta": string}}'
    )
    user = f"Topic: {topic}\nWrite a concise short-form script outline."
    raw = await chat_completion(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.65,
        response_format_json=True,
    )
    return json.loads(raw)


async def generate_unified_brief_json(topic: str, channel_context: dict) -> dict[str, Any]:
    """Generates a complete content strategy brief grounded in channel data."""
    clean_topic = _sanitize_topic(topic)
    niche = ", ".join(channel_context.get("niches", []))
    stats = (
        f"{channel_context.get('subscriber_count', 0)} subscribers, "
        f"{channel_context.get('view_count', 0)} total views"
    )

    system = (
        "You are an expert YouTube growth strategist for Indian creators. "
        "Reply with ONLY valid JSON, no markdown. Required schema: "
        '{"titles":[{"text":string,"hook_type":string}],'
        '"strategy_insight":string,'
        '"script_outline":{"hook":string,"retention_mid":string,"cta":string},'
        '"tags":[string]}. '
        "Provide exactly 3 titles, a 2-3 sentence strategy_insight, filled script_outline, and 6-10 tags."
    )
    user = (
        f"Topic: {clean_topic}\n"
        f"Channel context — niche: {niche or 'general'}. Stats: {stats}.\n"
        "Titles must be clickable but not misleading. "
        "Insight should explain niche fit and why now is a good time to post."
    )

    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]

    # Some free models return empty shells with response_format=json — retry without it.
    for use_json_mode in (False, True):
        try:
            raw = await chat_completion(
                messages,
                temperature=0.75 if use_json_mode else 0.7,
                response_format_json=use_json_mode,
            )
            data = _extract_json(raw) if not use_json_mode else json.loads(raw)
            brief = _normalize_brief(data, clean_topic)
            if not _brief_is_empty(brief):
                brief["generated_via"] = "ai"
                return brief
        except Exception as exc:
            print(f"[strategy] LLM brief attempt failed (json_mode={use_json_mode}): {exc}")
            continue

    print(f"[strategy] Using fallback brief for topic={clean_topic!r} (LLM unavailable or empty)")
    return _fallback_brief(clean_topic, channel_context)
