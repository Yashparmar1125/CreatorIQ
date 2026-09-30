import json
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def chat_completion(
    messages: list[dict[str, Any]],
    *,
    temperature: float = 0.6,
    response_format_json: bool = False,
    tools: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Execute chat completion against OpenRouter API with full tool-calling support.
    
    Returns the message object from the first choice:
    {
        "role": "assistant",
        "content": str | None,
        "tool_calls": list[dict] | None
    }
    """
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")

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
    if tools:
        body["tools"] = tools

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()

    if "choices" not in data or not data["choices"]:
        err = data.get("error") or data
        raise RuntimeError(f"OpenRouter error: {err}")

    choice = data["choices"][0]
    return choice.get("message", {})
