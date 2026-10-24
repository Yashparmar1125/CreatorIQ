import asyncio
import json
import logging
import time
import uuid
from typing import Any, AsyncGenerator

import httpx

from app.core.config import settings
from app.core.key_pool import groq_pool, gemini_pool, openrouter_pool

logger = logging.getLogger(__name__)


class LLMRouter:
    """
    Multi-Provider, Multi-Key LLM Router with Redis-backed key pool & automatic failover.
    1. Groq: openai/gpt-oss-120b (Primary for fast reasoning and structured tool-calling)
    2. Gemini API: gemini-3.8-flash (Primary for synthesis and long-context analysis)
    3. OpenRouter: Fallback
    """

    def __init__(self) -> None:
        pass

    async def chat(
        self,
        messages: list[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.6,
        prefer_provider: str = "groq",
    ) -> dict[str, Any]:
        """
        Execute chat completion with automatic provider failover and Redis-backed key rotation.
        Returns OpenAI-standard response dictionary:
        {
            "role": "assistant",
            "content": str | None,
            "tool_calls": list[dict] | None,
            "provider": str,
            "model": str,
        }
        """
        errors = []

        # 1. Try Groq (Primary for tool calling and reasoning)
        groq_all_keys = groq_pool.get_all_keys()
        if prefer_provider in ("groq", "any") and groq_all_keys:
            groq_models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
            for model_name in groq_models:
                for _ in range(len(groq_all_keys)):
                    key = await groq_pool.get_active_key()
                    if not key:
                        break
                    try:
                        res = await self._call_groq(key, messages, tools=tools, temperature=temperature, model=model_name)
                        await groq_pool.record_usage(key)
                        res["provider"] = "groq"
                        res["model"] = model_name
                        return res
                    except Exception as exc:
                        errors.append(f"Groq {model_name} error: {exc}")
                        logger.warning("Groq call failed with key ending in %s on model %s: %s", key[-6:], model_name, exc)
                        err_str = str(exc).lower()
                        if "429" in err_str or "rate limit" in err_str:
                            ttl = 86400 if ("daily" in err_str or "quota" in err_str) else 60
                            await groq_pool.mark_exhausted(key, cooldown_seconds=ttl, reason="rate_limit")

        # 2. Try Gemini 3.8 Flash (if no tools or as fallback)
        gemini_all_keys = gemini_pool.get_all_keys()
        if gemini_all_keys:
            for _ in range(len(gemini_all_keys)):
                key = await gemini_pool.get_active_key()
                if not key:
                    break
                try:
                    res = await self._call_gemini(key, messages, tools=tools, temperature=temperature)
                    await gemini_pool.record_usage(key)
                    res["provider"] = "gemini"
                    res["model"] = "gemini-3.8-flash"
                    return res
                except Exception as exc:
                    errors.append(f"Gemini error: {exc}")
                    logger.warning("Gemini call failed with key ending in %s: %s", key[-6:], exc)
                    err_str = str(exc).lower()
                    if "429" in err_str or "quota" in err_str:
                        ttl = 86400 if "daily" in err_str else 60
                        await gemini_pool.mark_exhausted(key, cooldown_seconds=ttl, reason="rate_limit")

        # 3. Try OpenRouter fallback across all pooled keys
        openrouter_all_keys = openrouter_pool.get_all_keys()
        if openrouter_all_keys:
            for _ in range(len(openrouter_all_keys)):
                key = await openrouter_pool.get_active_key()
                if not key:
                    break
                try:
                    res = await self._call_openrouter(key, messages, tools=tools, temperature=temperature)
                    await openrouter_pool.record_usage(key)
                    res["provider"] = "openrouter"
                    res["model"] = settings.llm_model
                    return res
                except Exception as exc:
                    errors.append(f"OpenRouter error: {exc}")
                    logger.warning("OpenRouter call failed with key ending in %s: %s", key[-6:], exc)
                    err_str = str(exc).lower()
                    if "429" in err_str or "rate limit" in err_str or "quota" in err_str:
                        ttl = 86400 if ("daily" in err_str or "quota" in err_str) else 60
                        await openrouter_pool.mark_exhausted(key, cooldown_seconds=ttl, reason="rate_limit")

        raise RuntimeError(f"All LLM providers failed. Errors: {'; '.join(errors)}")

    async def _call_groq(
        self,
        api_key: str,
        messages: list[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.6,
        model: str = "openai/gpt-oss-120b",
    ) -> dict[str, Any]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "CreatorIQ/1.0",
            "Content-Type": "application/json",
        }
        body: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        if tools:
            body["tools"] = tools
            body["tool_choice"] = "auto"

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers=headers, json=body)
            if resp.status_code != 200:
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")
            data = resp.json()
            choice = data["choices"][0]
            msg = choice.get("message", {})
            return {
                "role": "assistant",
                "content": msg.get("content") or "",
                "tool_calls": msg.get("tool_calls"),
            }

    async def _call_gemini(
        self,
        api_key: str,
        messages: list[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.6,
    ) -> dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "CreatorIQ/1.0",
        }

        # Convert messages to Gemini format
        contents = []
        system_instruction = None
        for m in messages:
            role = m.get("role")
            content = m.get("content") or ""
            if role == "system":
                system_instruction = {"parts": [{"text": content}]}
            elif role == "user":
                contents.append({"role": "user", "parts": [{"text": content}]})
            elif role == "assistant":
                contents.append({"role": "model", "parts": [{"text": content}]})
            elif role == "tool":
                contents.append({
                    "role": "user",
                    "parts": [{"text": f"Tool response for {m.get('name')}:\n{content}"}]
                })

        body: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {"temperature": temperature},
        }
        if system_instruction:
            body["systemInstruction"] = system_instruction

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers=headers, json=body)
            if resp.status_code != 200:
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")
            data = resp.json()
            candidates = data.get("candidates") or []
            if not candidates:
                raise RuntimeError(f"No candidates in Gemini response: {data}")
            parts = candidates[0].get("content", {}).get("parts", [])
            text_content = "".join(p.get("text", "") for p in parts)
            return {
                "role": "assistant",
                "content": text_content,
                "tool_calls": None,
            }

    async def _call_openrouter(
        self,
        api_key: str,
        messages: list[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.6,
    ) -> dict[str, Any]:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://creatoriq.yashparmar.in",
            "X-Title": "CreatorIQ",
        }
        body: dict[str, Any] = {
            "model": settings.llm_model,
            "messages": messages,
            "temperature": temperature,
        }
        if tools:
            body["tools"] = tools

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers=headers, json=body)
            if resp.status_code != 200:
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")
            data = resp.json()
            msg = data["choices"][0].get("message", {})
            return {
                "role": "assistant",
                "content": msg.get("content") or "",
                "tool_calls": msg.get("tool_calls"),
            }


llm_router = LLMRouter()
