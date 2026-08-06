"""OpenRouter AI layer — turns raw SerpApi signals into creator-ready opportunities."""

from __future__ import annotations

import json
import logging
from typing import Any

from app.core.config import settings
from app.core.openrouter import chat_completion

logger = logging.getLogger(__name__)

_ARCHETYPES = ("The Greenlight", "The Viral Spike", "The Evergreen", "The Discovery", "Peaking")


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
            "- topic: clean Title Case opportunity name.\n"
            "- headline: punchy hook under 12 words for the card.\n"
            "- why_trending: 1-2 sentences on why this is rising on YouTube.\n"
            "- growth_tip: personalized advice for THIS creator's tone and format.\n"
            "- content_angle: one specific video they could film today.\n"
            "- key_indicator: one metric line using the provided velocity/volume.\n"
            "- archetype: one of " + ", ".join(_ARCHETYPES) + ".\n"
            "Reply with ONLY valid JSON, no markdown.\n"
            'Schema: {"items": [{"id": string, "keep": true, "topic": string, "headline": string, '
            '"why_trending": string, "growth_tip": string, "content_angle": string, '
            '"key_indicator": string, "archetype": string}]}'
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
            "Transform this raw YouTube trend search into a creator-ready opportunity. "
            "Reply ONLY JSON: {\"id\": string, \"topic\": string, \"headline\": string, "
            "\"why_trending\": string, \"growth_tip\": string, \"content_angle\": string, "
            "\"key_indicator\": string, \"archetype\": string}. "
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
        out["topic"] = (ai.get("topic") or raw.get("topic") or "").strip()
        out["headline"] = (ai.get("headline") or out["topic"]).strip()
        out["why_trending"] = (ai.get("why_trending") or raw.get("why_trending") or "").strip()
        out["growth_tip"] = (ai.get("growth_tip") or raw.get("growth_tip") or "").strip()
        out["content_angle"] = (ai.get("content_angle") or "").strip()
        out["key_indicator"] = (ai.get("key_indicator") or raw.get("key_indicator") or "").strip()
        if ai.get("archetype") in _ARCHETYPES:
            out["archetype"] = ai["archetype"]
        out["description"] = out["why_trending"]
        out["ai_enriched"] = True
        out["ai_model"] = settings.llm_model
        return out

    def _rule_based_enrich(self, raw: dict[str, Any], ctx: dict[str, Any]) -> dict[str, Any]:
        """Deterministic fallback when LLM is unavailable or returns nothing."""
        out = dict(raw)
        title = (raw.get("topic") or "Trending Topic").strip()
        out["raw_topic"] = title
        out["topic"] = title.title()
        niche = (ctx.get("niches") or ["your niche"])[0]
        fmt = ctx.get("content_format") or "shorts"
        fmt_label = {"both": "short or long-form", "long_form": "long-form", "shorts": "Short"}.get(fmt, fmt)
        tone = ctx.get("tone") or "conversational"
        vol = raw.get("volume") or raw.get("key_indicator") or "rising search interest"
        out["headline"] = f"Rising in {niche} — worth a {fmt_label} video"
        out["why_trending"] = (
            f"'{title}' is gaining traction on YouTube with {vol}. "
            f"Creators in {niche} are starting to cover this angle."
        )
        out["growth_tip"] = (
            f"As a {tone} {niche} creator, test this with a quick {fmt} — "
            "your audience may discover you through search before the topic saturates."
        )
        out["content_angle"] = f"React to or remix the '{title}' trend with your own {tone} spin."
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
