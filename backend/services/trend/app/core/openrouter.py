import logging
from typing import Any

import httpx

from app.core.config import settings
from app.core.key_pool import openrouter_pool

logger = logging.getLogger(__name__)


async def chat_completion(
    messages: list[dict[str, Any]],
    *,
    temperature: float = 0.6,
    response_format_json: bool = False,
    tools: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Execute chat completion against OpenRouter API with full multi-key pool rotation and tool-calling support.
    
    Returns the message object from the first choice:
    {
        "role": "assistant",
        "content": str | None,
        "tool_calls": list[dict] | None
    }
    """
    all_keys = openrouter_pool.get_all_keys()
    if not all_keys:
        raise RuntimeError("OPENROUTER_API_KEY / OPENROUTER_API_KEYS is not set")

    url = f"{settings.openrouter_base_url.rstrip('/')}/chat/completions"

    candidate_models: list[str] = []
    for m in [
        settings.llm_model,
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
    ]:
        if m and m not in candidate_models and m != "openrouter/free":
            candidate_models.append(m)

    last_error: str = "Unknown OpenRouter error"
    async with httpx.AsyncClient(timeout=45.0) as client:
        for idx, model_slug in enumerate(candidate_models):
            for _ in range(len(all_keys)):
                active_key = await openrouter_pool.get_active_key()
                if not active_key:
                    break
                headers: dict[str, str] = {
                    "Authorization": f"Bearer {active_key}",
                    "Content-Type": "application/json",
                }
                if settings.openrouter_http_referer:
                    headers["HTTP-Referer"] = settings.openrouter_http_referer
                if settings.openrouter_app_title:
                    headers["X-Title"] = settings.openrouter_app_title

                req_body: dict[str, Any] = {
                    "model": model_slug,
                    "messages": messages,
                    "temperature": temperature,
                }
                if response_format_json and idx == 0:
                    req_body["response_format"] = {"type": "json_object"}
                if tools and idx == 0:
                    req_body["tools"] = tools

                try:
                    r = await client.post(url, headers=headers, json=req_body)
                    if r.status_code != 200:
                        last_error = f"HTTP {r.status_code}: {r.text[:200]}"
                        logger.warning(
                            "OpenRouter model '%s' key ...%s failed (%s); rotating key/model",
                            model_slug,
                            active_key[-6:],
                            last_error,
                        )
                        if r.status_code == 429:
                            await openrouter_pool.mark_exhausted(active_key, cooldown_seconds=60, reason="rate_limit")
                        continue

                    data = r.json()
                    if "choices" not in data or not data["choices"]:
                        last_error = f"No choices in response: {str(data)[:200]}"
                        logger.warning("OpenRouter model '%s' returned no choices (%s); trying next", model_slug, last_error)
                        continue

                    msg = data["choices"][0].get("message", {})
                    content = (msg.get("content") or "").strip()
                    if not content and msg.get("reasoning") and not msg.get("tool_calls"):
                        content = str(msg.get("reasoning")).strip()
                        msg["content"] = content

                    if content.startswith("User Safety:"):
                        last_error = f"Safety classifier output from {model_slug}"
                        logger.warning("Model '%s' returned safety classifier output; trying next", model_slug)
                        break

                    if not content and not msg.get("tool_calls"):
                        last_error = f"Empty content from {model_slug}"
                        logger.warning("Model '%s' returned empty content; trying next", model_slug)
                        break

                    await openrouter_pool.record_usage(active_key)
                    return msg
                except Exception as exc:
                    last_error = str(exc)
                    logger.warning("OpenRouter request exception for '%s': %s", model_slug, exc)
                    continue

    raise RuntimeError(f"All OpenRouter candidate models failed. Last error: {last_error}")
