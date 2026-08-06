"""Niche clusters for background collectors (spec G1)."""

NICHE_CLUSTERS: dict[str, dict] = {
    "Entertainment": {
        "queries": ["comedy shorts", "meme trends", "bollywood movie trailer"],
        "youtube_queries": ["comedy shorts india", "meme shorts", "funny shorts"],
        "geo_default": "IN",
        "category_id": "4",
    },
    "Gaming": {
        "queries": ["gaming trends", "new games", "esports"],
        "youtube_queries": ["gaming shorts", "bgmi gameplay", "minecraft shorts"],
        "geo_default": "IN",
        "category_id": "8",
    },
    "Tech": {
        "queries": ["tech news", "AI tools", "gadgets"],
        "youtube_queries": ["ai tools 2026", "tech review india", "gadget unboxing"],
        "geo_default": "US",
        "category_id": "0",
    },
    "Education": {
        "queries": ["study tips", "online courses", "exam preparation"],
        "youtube_queries": ["study tips shorts", "upsc preparation", "jee tips"],
        "geo_default": "IN",
        "category_id": "0",
    },
    "Fitness": {
        "queries": ["workout trends", "fitness motivation", "gym"],
        "youtube_queries": ["workout shorts", "gym motivation india"],
        "geo_default": "IN",
        "category_id": "7",
    },
    "Finance": {
        "queries": ["stock market", "investing tips", "personal finance"],
        "youtube_queries": ["stock market india", "personal finance tips"],
        "geo_default": "IN",
        "category_id": "0",
    },
    "Cooking": {
        "queries": ["recipe trends", "cooking hacks", "food"],
        "youtube_queries": ["recipe shorts", "street food india"],
        "geo_default": "IN",
        "category_id": "5",
    },
    "Music": {
        "queries": ["new music", "song trends", "music videos"],
        "youtube_queries": ["new song hindi", "music video trending"],
        "geo_default": "IN",
        "category_id": "4",
    },
    "Travel": {
        "queries": ["travel destinations", "budget travel", "vlog travel"],
        "youtube_queries": ["travel vlog india", "budget travel tips"],
        "geo_default": "IN",
        "category_id": "8",
    },
    "Beauty": {
        "queries": ["skincare trends", "makeup tutorial", "beauty hacks"],
        "youtube_queries": ["makeup tutorial shorts", "skincare routine india"],
        "geo_default": "IN",
        "category_id": "8",
    },
}

# YouTube Data API search queries (primary signal — real videos)
YOUTUBE_VIDEO_QUERIES: dict[str, list[str]] = {
    cluster: cfg.get("youtube_queries", [])
    for cluster, cfg in NICHE_CLUSTERS.items()
    if cfg.get("youtube_queries")
}

NICHE_KEYWORDS: dict[str, list[str]] = {
    "entertainment": ["entertainment", "movie", "film", "comedy", "meme", "memes", "funny", "celebrity", "show", "bollywood", "stand up", "roast", "skit", "prank"],
    "gaming": ["game", "gaming", "esports", "playstation", "xbox", "valorant", "minecraft", "stream"],
    "tech": ["tech", "ai", "software", "app", "gadget", "phone", "computer", "coding", "startup"],
    "education": ["study", "exam", "course", "learn", "school", "tutorial", "upsc", "jee"],
    "fitness": ["fitness", "gym", "workout", "exercise", "health", "yoga", "muscle"],
    "finance": ["finance", "stock", "invest", "money", "crypto", "trading", "market"],
    "cooking": ["recipe", "cook", "food", "kitchen", "chef", "meal"],
    "music": ["music", "song", "album", "singer", "concert", "spotify"],
    "travel": ["travel", "trip", "tour", "destination", "hotel", "flight"],
    "beauty": ["beauty", "skincare", "makeup", "fashion", "style"],
}

PLAN_CREDITS = {"free": 2, "pro": 20, "agency": 100}

# Targeted queries for on-demand collection when a user's feed pool is thin
ON_DEMAND_QUERIES: dict[str, list[str]] = {
    "Entertainment": ["comedy shorts", "meme compilation", "funny reels india", "bollywood trailer"],
    "Gaming": ["gaming shorts", "new game 2026", "bgmi update", "minecraft trends"],
    "Tech": ["ai tools youtube", "tech review", "gadget unboxing"],
    "Music": ["new song trending", "music video india"],
    "Fitness": ["workout shorts", "gym motivation"],
    "Cooking": ["recipe shorts", "street food india"],
    "Beauty": ["makeup tutorial shorts", "skincare routine"],
    "Education": ["study tips shorts", "exam preparation"],
    "Finance": ["stock market india", "investing tips"],
    "Travel": ["travel vlog india", "budget travel"],
}
