"""Trend opportunity scoring — spec section 6."""

from app.services.quality_filters import has_creator_topic_signal

NICHE_FIT_THRESHOLD = 0.45
GEO_RELEVANCE_THRESHOLD = 0.15
GLOBAL_FALLBACK_GEO = {"US": 0.55, "IN": 0.35, "UK": 0.10}

# Tag match alone is weak — title must reinforce niche relevance
_TAG_ONLY_CAP = 0.55


def normalize_weights(weights: dict[str, float]) -> dict[str, float]:
    total = sum(float(v) for v in weights.values() if v)
    if total <= 0:
        return {}
    return {k.upper(): round(float(v) / total, 4) for k, v in weights.items() if v}


def niche_fit_score(*, user_niches: list[str], concept_niches: list[str], title: str, keywords: list[str]) -> float:
    user = [n.lower().strip() for n in user_niches if n]
    tags = [t.lower() for t in concept_niches if t]
    title_l = title.lower()
    if not user:
        return 0.5

    tag_hit = False
    title_hits = 0.0

    for niche in user:
        if any(niche in t or t in niche for t in tags):
            tag_hit = True
        if niche in title_l:
            title_hits += 1.5
        for kw in keywords:
            if len(kw) < 3:
                continue
            if kw in title_l:
                title_hits += 1.0
            elif niche in kw and kw in title_l:
                title_hits += 0.5

    max_title = max(len(user) * 2.0, 1)
    title_score = min(1.0, title_hits / max_title)

    if not tag_hit:
        return title_score * 0.7

    # Strong title signal + matching cluster = good fit
    if has_creator_topic_signal(title) and title_score >= 0.25:
        return min(1.0, 0.45 + 0.55 * title_score)

    if title_score < 0.2:
        return min(_TAG_ONLY_CAP, title_score + 0.3)

    return min(1.0, 0.35 + 0.65 * title_score)


def geo_weighted_relevance(
    *,
    audience_weights: dict[str, float],
    concept_geo: dict[str, float],
    geo_source: str,
) -> float:
    audience = normalize_weights(audience_weights) or GLOBAL_FALLBACK_GEO
    concept = normalize_weights(concept_geo) if concept_geo else {k: 0.5 for k in audience}

    if not concept:
        return 0.5 if geo_source == "global_default" else 0.4

    score = 0.0
    for country, weight in audience.items():
        score += weight * float(concept.get(country, concept.get(country.lower(), 0.1)))
    return min(1.0, score)


def format_fit_score(*, user_format: str, supported: list[str]) -> float:
    if not supported or user_format == "both":
        return 1.0
    if user_format in supported or "both" in supported:
        return 1.0
    return 0.6


def compute_raw_momentum(
    *,
    youtube_video_velocity: float,
    youtube_search_velocity: float,
    google_trends_growth: float,
    search_volume_norm: float,
    news_boost: float = 0.0,
) -> float:
    return min(
        100.0,
        0.40 * youtube_video_velocity
        + 0.15 * youtube_search_velocity
        + 0.15 * 0.0  # competitor_coverage stub
        + 0.15 * google_trends_growth
        + 0.10 * search_volume_norm
        + 0.05 * min(news_boost, 20.0),
    )


def opportunity_score(
    *,
    raw_momentum: float,
    niche_fit: float,
    geo_relevance: float,
    format_fit: float,
) -> float:
    return (
        0.50 * (raw_momentum / 100.0)
        + 0.25 * niche_fit
        + 0.20 * geo_relevance
        + 0.05 * format_fit
    ) * 100.0
