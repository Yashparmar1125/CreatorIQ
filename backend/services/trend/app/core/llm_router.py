import asyncio
import json
import logging
import time
import uuid
from typing import Any, AsyncGenerator

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMRouter:
    """
    Multi-Provider, Multi-Key LLM Router with automatic failover and key rotation.
    1. Groq: openai/gpt-oss-120b (Primary for fast reasoning and structured tool-calling)
    2. Gemini API: gemini-3.8-flash (Primary for synthesis and long-context analysis)
    3. OpenRouter: Fallback
    """

    def __init__(self) -> None:
        self.groq_keys = [
            k.strip() for k in (settings.groq_api_keys or settings.groq_api_key).split(",") if k.strip()
        ]
        self.gemini_keys = [
            k.strip() for k in (settings.gemini_api_keys or settings.gemini_api_key).split(",") if k.strip()
        ]
        self.openrouter_keys = [
            k.strip() for k in settings.openrouter_api_key.split(",") if k.strip()
        ]

        self._groq_idx = 0
        self._gemini_idx = 0
        self._cooldowns: dict[str, float] = {}

    def _get_active_groq_key(self) -> str | None:
        if not self.groq_keys:
            return None
        now = time.time()
        for _ in range(len(self.groq_keys)):
            key = self.groq_keys[self._groq_idx % len(self.groq_keys)]
            self._groq_idx += 1
            if self._cooldowns.get(key, 0) < now:
                return key
        return self.groq_keys[0]

    def _get_active_gemini_key(self) -> str | None:
        if not self.gemini_keys:
            return None
        now = time.time()
        for _ in range(len(self.gemini_keys)):
            key = self.gemini_keys[self._gemini_idx % len(self.gemini_keys)]
            self._gemini_idx += 1
            if self._cooldowns.get(key, 0) < now:
                return key
        return self.gemini_keys[0]

    def _mark_cooldown(self, key: str, seconds: float = 60.0) -> None:
        self._cooldowns[key] = time.time() + seconds

    async def chat(
        self,
        messages: list[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.6,
        prefer_provider: str = "groq",
    ) -> dict[str, Any]:
        """
        Execute chat completion with automatic provider failover.
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
        if prefer_provider in ("groq", "any") and self.groq_keys:
            for _ in range(len(self.groq_keys)):
                key = self._get_active_groq_key()
                if not key:
                    break
                try:
                    res = await self._call_groq(key, messages, tools=tools, temperature=temperature)
                    res["provider"] = "groq"
                    res["model"] = "openai/gpt-oss-120b"
                    return res
                except Exception as exc:
                    errors.append(f"Groq error: {exc}")
                    logger.warning("Groq call failed with key ending in %s: %s", key[-6:], exc)
                    self._mark_cooldown(key, 45.0)

        # 2. Try Gemini 3.8 Flash (if no tools or as fallback)
        if self.gemini_keys:
            for _ in range(len(self.gemini_keys)):
                key = self._get_active_gemini_key()
                if not key:
                    break
                try:
                    res = await self._call_gemini(key, messages, tools=tools, temperature=temperature)
                    res["provider"] = "gemini"
                    res["model"] = "gemini-3.8-flash"
                    return res
                except Exception as exc:
                    errors.append(f"Gemini error: {exc}")
                    logger.warning("Gemini call failed with key ending in %s: %s", key[-6:], exc)
                    self._mark_cooldown(key, 45.0)

        # 3. Try OpenRouter fallback
        if self.openrouter_keys:
            try:
                res = await self._call_openrouter(self.openrouter_keys[0], messages, tools=tools, temperature=temperature)
                res["provider"] = "openrouter"
                res["model"] = settings.llm_model
                return res
            except Exception as exc:
                errors.append(f"OpenRouter error: {exc}")
                logger.warning("OpenRouter fallback failed: %s", exc)

        raise RuntimeError(f"All LLM providers failed. Errors: {'; '.join(errors)}")

    async def _call_groq(
        self,
        api_key: str,
        messages: list[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None = None,
        temperature: float = 0.6,
    ) -> dict[str, Any]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "CreatorIQ/1.0",
            "Content-Type": "application/json",
        }
        body: dict[str, Any] = {
            "model": "openai/gpt-oss-120b",
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
