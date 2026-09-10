"""OpenRouter AI layer — turns raw SerpApi signals into creator-ready opportunities."""

from __future__ import annotations

import json
import logging
from typing import Any

from app.core.config import settings
from app.core.openrouter import chat_completion

logger = logging.getLogger(__name__)

_ARCHETYPES = ("The Greenlight", "The Viral Spike", "The Evergreen", "The Discovery", "Peaking")


import re

def _clean_title(text: str | None) -> str:
    if not text:
        return "Trending Opportunity"
    cleaned = re.sub(r'#\w+', '', text)
    cleaned = re.sub(r'#', '', cleaned)
    # Remove channel attribution after pipes or double pipes (e.g. "|| Preetha Vibes" or "| Bhawna Saini vlogs" or trailing "|")
    cleaned = re.sub(r'\s*\|+.*$', '', cleaned)
    cleaned = re.sub(r'\s*-\s*YouTube$', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*//+.*$', '', cleaned)
    # Remove leading/trailing punctuation like |, -, :, quotes
    cleaned = re.sub(r'^[\s\-–—:,"\'|]+|[\s\-–—:,"\'|]+$', '', cleaned)
    cleaned = re.sub(r'_', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if not cleaned:
        return "Trending Opportunity"
    if cleaned.islower():
        cleaned = cleaned.title()
    return cleaned


def _clean_text(text: str | None) -> str:
    if not text:
        return ""
    cleaned = re.sub(r'#\w+', '', text)
    cleaned = re.sub(r'#', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
_SHORTS_CONCEPTS = [
    "Hook: 'Wait till the end...' Test '{title}' with a real-time before & after comparison for {niche} viewers.",
    "POV: Trying the '{title}' trend for the very first time without watching a tutorial.",
    "The 60-Second Challenge: Can you pull off '{title}' in real time with zero cuts?",
    "Is '{title}' actually legit? Test the viral claim in 45 seconds with instant proof.",
    "Behind the scenes of '{title}': Film what actually happens off-camera in a rapid 30s cut.",
    "Expectation vs Reality: The '{title}' trend executed by a beginner vs. a pro {niche} creator.",
    "The 1 trick everyone misses with '{title}' — reveal and demonstrate the fix in the opening 3 seconds.",
    "Testing '{title}' so you don't have to — give your raw, unfiltered verdict on a 1-to-10 scale.",
]

_LONG_FORM_CONCEPTS = [
    "The Rise and Impact of '{title}': An investigative breakdown of why this captivated {niche} viewers.",
    "The Ultimate Guide to '{title}': Step-by-step masterclass covering every detail for {niche} creators.",
    "I Tested '{title}' for 7 Days Straight — Here is what happened to my stats and audience reach.",
    "Tier List: Ranking every single variation and technique of '{title}' from worst to god-tier.",
    "The Truth About '{title}' Nobody Is Telling You: Unfiltered breakdown backed by real evidence.",
    "Mastering '{title}' from scratch: 0 to 100 complete walkthrough for serious {niche} creators.",
]

_HEADLINES = [
    "Peaking Search Velocity — High Virality Potential in {niche}",
    "Early Breakout Signal — Low Competition Opportunity in {niche}",
    "Audience Demand Surge — Perfect for High Retention",
    "Fast-Growing Topic — Ride the Early Discovery Wave",
    "Untapped Search Angle — Strong Viewer Retention Signal",
    "Viral Momentum Detected — High Click-Through Rate Window",
]


class TrendEnrichmentService:
    async def enrich_feed_items(
        self,
        items: list[dict[str, Any]],
        ctx: dict[str, Any],
        *,
        ranked_backup: list[dict[str, Any]] | None = None,
    ) -> list[dict[str, Any]]:
        if not items:
            return items
        if not settings.openrouter_api_key:
            return [self._mark_fallback(x) for x in items]

        try:
            enriched = await self._call_llm(items, ctx)
        except Exception:
            logger.exception("Trend enrichment failed — using rule-based fallback")
            return [self._rule_based_enrich(x, ctx) for x in items]

        if not enriched:
            return [self._rule_based_enrich(x, ctx) for x in items]

        by_id = {str(x.get("id")): x for x in enriched if x.get("id") is not None}
        output: list[dict[str, Any]] = []
        used_ids: set[str] = set()

        for raw in items:
            rid = str(raw["id"])
            ai = by_id.get(rid)
            if ai:
                output.append(self._merge(raw, ai))
                used_ids.add(rid)
            else:
                output.append(self._rule_based_enrich(raw, ctx))
                used_ids.add(rid)

        # Backfill if AI rejected too many
        if ranked_backup and len(output) < 5:
            for candidate in ranked_backup:
                cid = str(candidate["id"])
                if cid in used_ids or cid in {str(x["id"]) for x in items}:
                    continue
                if len(output) >= 5:
                    break
                try:
                    extra = await self._call_llm([candidate], ctx)
                    if extra and extra[0].get("keep", True):
                        output.append(self._merge(candidate, extra[0]))
                        used_ids.add(cid)
                except Exception:
                    output.append(self._mark_fallback(candidate))
                    used_ids.add(cid)

        return output[:5] if output else [self._rule_based_enrich(x, ctx) for x in items[:5]]

    async def _call_llm(self, items: list[dict[str, Any]], ctx: dict[str, Any]) -> list[dict[str, Any]]:
        niches = ", ".join(ctx.get("niches") or ["General"])
        tone = ctx.get("tone") or "mixed"
        fmt = ctx.get("content_format") or "both"
        channel = ctx.get("channel_name") or "this creator"
        subs = ctx.get("subscriber_count") or 0

        payload = [
            {
                "id": x["id"],
                "raw_topic": x.get("topic"),
                "search_volume": x.get("search_volume"),
                "velocity": x.get("velocity"),
                "niche_tags": x.get("niches"),
                "why_raw": x.get("why_trending"),
            }
            for x in items
        ]

        system = (
            "You are CreatorIQ's trend curator for YouTube creators. "
            "You receive raw Google Trends search strings and transform them into polished, actionable content opportunities.\n\n"
            "Rules:\n"
            "- Return EXACTLY one JSON object per input id (same id string). Never return an empty items array.\n"
            "- ALWAYS set keep=true. Filtering already happened upstream.\n"
            "- Fix grammar, clarify cryptic names (e.g. '67 meme' → explain the meme trend in plain English).\n"
            "- NEVER include hashtags, # symbols, or raw video tags in the topic, headline, why_predicted, or action_plan.\n"
            "- topic: clean Title Case logical opportunity name (NO HASHTAGS).\n"
            "- headline: punchy hook under 12 words for the card (NO HASHTAGS).\n"
            "- why_trending: 1-2 sentences on why this is rising on YouTube (NO HASHTAGS).\n"
            "- why_predicted: personalized 1-sentence explanation why this specific trend was predicted for THIS creator's niche and geography (NO HASHTAGS).\n"
            "- growth_tip: personalized advice for THIS creator's tone and format (NO HASHTAGS).\n"
            "- video_concept: one creative, highly-clickable video concept idea tailored for this creator (NO HASHTAGS, NO generic 'React to or remix' boilerplate).\n"
            "- content_angle: one specific video concept or editorial angle they could film today (NO HASHTAGS, NO generic boilerplate).\n"
            "- action_plan: step-by-step 1-sentence content creation action for this video (NO HASHTAGS).\n"
            "- key_indicator: one metric line using the provided velocity/volume.\n"
            "- archetype: one of " + ", ".join(_ARCHETYPES) + ".\n"
            "- DIVERSITY RULE: NEVER use generic formulas like 'React to or remix the ... trend with your own spin' or 'Test the viral ... trend'. Every video_concept and content_angle must be an original, concrete viral idea.\n"
            "Reply with ONLY valid JSON, no markdown.\n"
            'Schema: {"items": [{"id": string, "keep": true, "topic": string, "headline": string, '
            '"why_trending": string, "why_predicted": string, "growth_tip": string, "video_concept": string, '
            '"content_angle": string, "action_plan": string, "key_indicator": string, "archetype": string}]}'
        )

        user = (
            f"Creator profile:\n"
            f"- Channel: {channel}\n"
            f"- Subscribers: {subs}\n"
            f"- Niches: {niches}\n"
            f"- Tone: {tone}\n"
            f"- Primary format: {fmt}\n\n"
            f"Raw trend signals to curate:\n{json.dumps(payload, ensure_ascii=False)}"
        )

        try:
            raw = await chat_completion(
                [{"role": "system", "content": system}, {"role": "user", "content": user}],
                temperature=0.35,
                response_format_json=True,
            )
            data = json.loads(raw)
            result = data.get("items") or data.get("trends") or data.get("opportunities") or []
            if not result and isinstance(data, list):
                result = data
            if result:
                return list(result)
        except Exception:
            logger.warning("OpenRouter batch enrichment failed", exc_info=True)

        logger.info("Retrying enrichment one-by-one for %d items", len(payload))
        singles: list[dict[str, Any]] = []
        for entry in payload:
            try:
                one = await self._call_llm_single(entry, niches, tone, fmt, channel, subs)
                if one:
                    singles.append(one)
            except Exception:
                logger.warning("Single enrichment failed for %s", entry.get("id"), exc_info=True)
        return singles

    async def _call_llm_single(
        self,
        entry: dict[str, Any],
        niches: str,
        tone: str,
        fmt: str,
        channel: str,
        subs: int,
    ) -> dict[str, Any] | None:
        system = (
            "Transform this raw YouTube trend search into a creator-ready opportunity without any hashtags. "
            "Reply ONLY JSON: {\"id\": string, \"topic\": string, \"headline\": string, "
            "\"why_trending\": string, \"why_predicted\": string, \"growth_tip\": string, \"content_angle\": string, "
            "\"action_plan\": string, \"key_indicator\": string, \"archetype\": string}. "
            f"Archetype must be one of: {', '.join(_ARCHETYPES)}."
        )
        user = (
            f"Creator: {channel}, {subs} subs, niches={niches}, tone={tone}, format={fmt}.\n"
            f"Raw signal: {json.dumps(entry, ensure_ascii=False)}"
        )
        raw = await chat_completion(
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.4,
            response_format_json=True,
        )
        data = json.loads(raw)
        if isinstance(data, dict) and data.get("id"):
            return data
        wrapped = data.get("items") if isinstance(data, dict) else None
        if wrapped and isinstance(wrapped, list) and wrapped:
            return wrapped[0]
        return None

    def _merge(self, raw: dict[str, Any], ai: dict[str, Any]) -> dict[str, Any]:
        out = dict(raw)
        out["raw_topic"] = raw.get("topic")
        out["topic"] = _clean_title(ai.get("topic") or raw.get("topic"))
        out["headline"] = _clean_title(ai.get("headline") or out["topic"])
        out["why_trending"] = _clean_text(ai.get("why_trending") or raw.get("why_trending"))
        out["why_predicted"] = _clean_text(ai.get("why_predicted") or f"Predicted for your channel based on high similarity and momentum.")
        out["growth_tip"] = _clean_text(ai.get("growth_tip") or raw.get("growth_tip"))
        out["video_concept"] = _clean_text(ai.get("video_concept") or ai.get("content_angle") or "")
        out["content_angle"] = _clean_text(ai.get("content_angle") or ai.get("video_concept") or "")
        out["action_plan"] = _clean_text(ai.get("action_plan") or ai.get("content_angle") or ai.get("growth_tip"))
        out["key_indicator"] = _clean_text(ai.get("key_indicator") or raw.get("key_indicator"))
        if ai.get("archetype") in _ARCHETYPES:
            out["archetype"] = ai["archetype"]
        out["description"] = out["why_trending"]
        out["ai_enriched"] = True
        out["ai_model"] = settings.llm_model
        return out

    def _rule_based_enrich(self, raw: dict[str, Any], ctx: dict[str, Any]) -> dict[str, Any]:
        """Deterministic fallback when LLM is unavailable or returns nothing."""
        out = dict(raw)
        title = _clean_title(raw.get("topic") or "Trending Topic")
        out["raw_topic"] = title
        out["topic"] = title
        niche = (ctx.get("niches") or ["your niche"])[0]
        fmt = ctx.get("content_format") or "shorts"
        fmt_label = {"both": "short or long-form", "long_form": "long-form", "shorts": "Short"}.get(fmt, fmt)
        tone = ctx.get("tone") or "conversational"
        vol = raw.get("volume") or raw.get("key_indicator") or "rising search interest"
        seed = abs(hash(f"{raw.get('id', '')}:{title}"))
        is_shorts = fmt in ("shorts", "both")
        concepts = _SHORTS_CONCEPTS if is_shorts else _LONG_FORM_CONCEPTS
        concept_template = concepts[seed % len(concepts)]
        concept_str = concept_template.format(title=title, niche=niche)
        headline_template = _HEADLINES[seed % len(_HEADLINES)]
        headline_str = headline_template.format(niche=niche)

        out["headline"] = headline_str
        out["why_trending"] = (
            f"'{title}' is gaining traction on YouTube with {vol}. "
            f"Creators in {niche} are starting to cover this angle."
        )
        out["why_predicted"] = (
            f"Matched to your channel because '{title}' has high search velocity in {niche} and strong audience relevance."
        )
        out["growth_tip"] = (
            f"As a {tone} {niche} creator, test this with a quick {fmt} — "
            "your audience may discover you through search before the topic saturates."
        )
        out["video_concept"] = concept_str
        out["content_angle"] = concept_str
        out["action_plan"] = f"Film a {fmt_label} video testing '{title}' using a {tone} hook in the first 5 seconds."
        out["description"] = out["why_trending"]
        out["ai_enriched"] = False
        return out

    def _mark_fallback(self, raw: dict[str, Any]) -> dict[str, Any]:
        out = dict(raw)
        out["raw_topic"] = raw.get("topic")
        out["headline"] = raw.get("topic")
        out["content_angle"] = ""
        out["ai_enriched"] = False
        return out

    async def enrich_detail(self, item: dict[str, Any], ctx: dict[str, Any]) -> dict[str, Any]:
        """Detail-page enrichment — adds title ideas (not shown on feed cards)."""
        out = dict(item)
        if settings.openrouter_api_key:
            try:
                titles = await self._call_detail_titles(item, ctx)
                if titles:
                    out["title_ideas"] = titles
            except Exception:
                logger.warning("Detail title enrichment failed for %s", item.get("id"), exc_info=True)
        if "title_ideas" not in out:
            out["title_ideas"] = self._rule_based_titles(item, ctx)
        return out

    async def _call_detail_titles(self, item: dict[str, Any], ctx: dict[str, Any]) -> list[str]:
        niches = ", ".join(ctx.get("niches") or ["General"])
        tone = ctx.get("tone") or "mixed"
        fmt = ctx.get("content_format") or "both"
        channel = ctx.get("channel_name") or "this creator"
        topic = item.get("topic") or item.get("raw_topic") or "Trending topic"

        system = (
            "You are a YouTube title strategist. Generate exactly 5 click-worthy video title ideas "
            "for the given trend opportunity. Match the creator's tone and format. "
            "Reply ONLY valid JSON: {\"title_ideas\": [string, string, string, string, string]}"
        )
        user = (
            f"Creator: {channel}, niches={niches}, tone={tone}, format={fmt}.\n"
            f"Trend: {topic}\n"
            f"Angle: {item.get('content_angle') or item.get('growth_tip') or ''}"
        )
        raw = await chat_completion(
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.6,
            response_format_json=True,
        )
        data = json.loads(raw)
        ideas = data.get("title_ideas") or data.get("titles") or []
        return [str(t).strip() for t in ideas if str(t).strip()][:5]

    def _rule_based_titles(self, item: dict[str, Any], ctx: dict[str, Any]) -> list[str]:
        topic = (item.get("topic") or "This Trend").strip()
        niche = (ctx.get("niches") or ["your niche"])[0]
        tone = ctx.get("tone") or "conversational"
        return [
            f"I tried the {topic} trend so you don't have to",
            f"{topic} — what every {niche} creator should know",
            f"My honest take on {topic} ({tone} edition)",
            f"How I'd cover {topic} as a {niche} creator",
            f"{topic}: the opportunity most creators are missing",
        ]
