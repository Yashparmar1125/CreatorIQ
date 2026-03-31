import json
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

    content = data["choices"][0]["message"]["content"]
    if not isinstance(content, str):
        raise RuntimeError("Unexpected OpenRouter response shape")
    return content


async def generate_content_ideas_json(topic: str, channel_context: str = "") -> dict[str, Any]:
    """Returns parsed JSON with key 'ideas': list of {title, angle}."""
    system = (
        "You are a YouTube content strategist. Reply with ONLY valid JSON, no markdown. "
        "Schema: {\"ideas\": [{\"title\": string, \"angle\": string}] } with exactly 3 ideas."
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
        "Schema: {\"titles\": [string], \"tags\": [string], "
        "\"script_outline\": {\"hook\": string, \"sections\": [string], \"cta\": string} }"
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
    system = "Reply with ONLY valid JSON: {\"tags\": [string]}. Tags must be YouTube-style keywords, no #."
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
    raw = await chat_completion(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.65,
        response_format_json=True,
    )
    return json.loads(raw)


async def generate_unified_brief_json(topic: str, channel_context: dict) -> dict[str, Any]:
    """Generates a complete content strategy brief grounded in channel data."""
    system = (
        "You are an expert YouTube growth strategist. Reply with ONLY valid JSON. "
        "Schema: {"
        "  \"titles\": [{\"text\": string, \"hook_type\": string}], "
        "  \"strategy_insight\": string, "
        "  \"script_outline\": {\"hook\": string, \"retention_mid\": string, \"cta\": string}, "
        "  \"tags\": [string]"
        "}"
    )
    
    niche = ", ".join(channel_context.get("niches", []))
    stats = f"{channel_context.get('subscriber_count', 0)} subscribers, {channel_context.get('view_count', 0)} total views"
    
    user = (
        f"Topic: {topic}\n"
        f"Channel Context: Niche: {niche}. Stats: {stats}.\n"
        "Generate a high-performance strategy. Titles should be clickable but not clickbait. "
        "Insight should explain why this topic is a good 'fit' or 'gap' for this specific channel."
    )
    
    raw = await chat_completion(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.75,
        response_format_json=True,
    )
    return json.loads(raw)
