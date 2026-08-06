"""Reject low-quality / non-actionable trend concepts before they reach the feed."""

from __future__ import annotations

import re

# Titles matching these patterns are news scandals, not content opportunities
_REJECT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(p, re.I)
    for p in [
        r"\bviral video\b",
        r"\bviral news\b",
        r"\bviral clip\b",
        r"\bgirl viral\b",
        r"\bboy viral\b",
        r"\bman viral\b",
        r"\bwoman viral\b",
        r"\bnews\b",
        r"\bscandal\b",
        r"\bleaked\b",
        r"\barrested\b",
        r"\bdeath\b",
        r"\bmurder\b",
        r"\baccident\b",
        r"\bcontroversy\b",
        r"\bpolitician\b",
        r"\bcm\b",
        r"\bpm\b",
        r"\belection\b",
        r"\bviral video news\b",
    ]
]

# At least one of these should appear in the title for it to be a real content topic
_CREATOR_TOPIC_SIGNALS: list[str] = [
    "comedy", "meme", "memes", "funny", "joke", "roast", "skit",
    "movie", "film", "series", "show", "trailer", "review", "ott", "netflix",
    "bollywood", "hollywood", "anime", "song", "music", "dance",
    "game", "gaming", "minecraft", "valorant", "pubg", "bgmi", "esports",
    "challenge", "prank", "reaction", "shorts", "vlog", "tutorial",
    "tips", "hacks", "recipe", "workout", "fitness", "travel", "beauty",
    "tech", "ai", "gadget", "phone", "coding", "study", "exam",
    "stock", "stocks", "market", "invest", "investing", "finance", "money",
    "trading", "nifty", "sensex", "mutual fund", "dividend", "portfolio", "sip", "crypto",
    "trend", "trending", "new", "best", "top", "how to",
]

_MIN_TITLE_LEN = 4
_MIN_SEARCH_VOLUME = 500


def is_low_quality_title(title: str) -> bool:
    t = title.strip().lower()
    if len(t) < _MIN_TITLE_LEN:
        return True
    return any(p.search(t) for p in _REJECT_PATTERNS)


def has_creator_topic_signal(title: str) -> bool:
    t = title.lower()
    return any(sig in t for sig in _CREATOR_TOPIC_SIGNALS)


def passes_ingest_quality(title: str, *, search_volume: int = 0) -> bool:
    """Collector gate — skip junk before it enters the concept store."""
    if is_low_quality_title(title):
        return False
    if search_volume > 0 and search_volume < 100:
        return False
    return True


def passes_feed_quality(title: str, *, search_volume: int = 0) -> bool:
    """Stricter gate for personalized feed."""
    if is_low_quality_title(title):
        return False
    if search_volume > 0 and search_volume < _MIN_SEARCH_VOLUME:
        return False
    # Reject tag-only matches: title must signal an actual content topic
    if not has_creator_topic_signal(title):
        return False
    return True
