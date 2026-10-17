"""
LLM Concept Normalizer & Topic Clustering Engine.
Transforms raw video titles and search phrases into durable, structured Canonical Concepts.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.core.llm_router import LLMRouter

logger = logging.getLogger(__name__)


def _extract_json_block(text: str) -> Any:
    """Robustly extract JSON payload from LLM markdown fences or raw text."""
    if not text:
        return None
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    candidate_str = match.group(1).strip() if match else text.strip()
    try:
        return json.loads(candidate_str)
    except Exception:
        # Fallback regex search for json list or object
        list_match = re.search(r"\[\s*\{[\s\S]*\}\s*\]", candidate_str)
        if list_match:
            try:
                return json.loads(list_match.group(0))
            except Exception:
                pass
        dict_match = re.search(r"\{\s*\"[^\"]+\"[\s\S]*\}", candidate_str)
        if dict_match:
            try:
                return json.loads(dict_match.group(0))
            except Exception:
                pass
    return None


class LLMConceptExtractor:
    """Clusters noisy creator signals into clean, search-ready canonical concepts."""

    def __init__(self) -> None:
        self.router = LLMRouter()

    async def extract_concepts_from_signals(
        self,
        category: str,
        signals: list[dict[str, Any]],
        existing_concept_names: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        if not signals:
            return []

        # Prepare raw signal text
        titles = [s.get("title") for s in signals if s.get("title")][:30]
        if not titles:
            return []

        existing_str = ", ".join(f"'{name}'" for name in (existing_concept_names or [])[:20])

        system_prompt = (
            "You are CreatorIQ's Chief Topic Taxonomy Engine. Your task is to analyze raw trending video titles, "
            "search queries, and creator discussions, and identify 1 to 3 distinct, emerging CANONICAL CONCEPTS. "
            "A Canonical Concept is a broad, repeatable topic cluster that multiple creators are making videos about.\n\n"
            "DO NOT create single-video titles or clickbait names (e.g. 'I Tried X for 7 Days' is NOT a concept; "
            "'Carnivore Diet & Animal-Based Nutrition' IS a concept).\n\n"
            f"Already existing concepts in this niche: [{existing_str}]. DO NOT duplicate or closely rephrase these!\n\n"
            "Return ONLY a valid JSON object matching this schema:\n"
            "{\n"
            '  "concepts": [\n'
            "    {\n"
            '      "proposed_name": "string (Clean, professional 3-6 word canonical title)",\n'
            '      "category": "string (e.g. Tech, Fitness, Gaming, Finance, Education, Lifestyle)",\n'
            '      "description": "string (1-2 sentences explaining what this trend is and why creators are covering it)",\n'
            '      "include_terms": ["string", "string", "string"] (3 to 5 targeted search phrases to find real videos),\n'
            '      "exclude_terms": ["string", "string"] (2 to 3 negative keywords to filter off-topic noise),\n'
            '      "confidence_score": float (between 0.5 and 0.95 based on signal coherence)\n'
            "    }\n"
            "  ]\n"
            "}"
        )

        user_content = f"Niche: {category}\nRaw Trending Titles & Signals:\n" + "\n".join(f"- {t}" for t in titles)

        try:
            res = await self.router.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=0.3,
                prefer_provider="groq",
            )
            content = res.get("content") or ""
            data = _extract_json_block(content)
            if isinstance(data, dict) and "concepts" in data:
                return data["concepts"]
            if isinstance(data, list):
                return data
            logger.warning("LLM response did not contain valid concepts JSON: %s", content[:150])
            return []
        except Exception as exc:
            logger.error("LLM concept extraction failed for category %s: %s", category, exc)
            return []
