/**
 * Sanitizes trend titles by removing hashtags (#shorts, #viral, #unboxing),
 * channel attribution trailers (|| Channel, | Vlogs, - YouTube),
 * trailing pipes/punctuation, and formatting clean logical titles.
 */
export function cleanTrendTitle(text?: string | null): string {
  if (!text) return 'Trending Opportunity';

  let cleaned = text
    // Remove hashtags (e.g. #shorts, #unboxing, #m3)
    .replace(/#\w+/gi, '')
    // Remove orphan # symbols
    .replace(/#/g, '')
    // Remove channel attribution after pipes or double pipes (e.g. "|| Preetha Vibes", "| Bhawna Saini vlogs", or dangling "|")
    .replace(/\s*\|+.*$/g, '')
    // Remove trailing "- YouTube" or "- Topic"
    .replace(/\s*-\s*YouTube$/i, '')
    // Remove trailing channel name after double slash
    .replace(/\s*\/\/+.*$/g, '')
    // Remove trailing/leading punctuation like |, -, –, —, :, ,, quotes
    .replace(/^[\s\-–—:,"'|]+|[\s\-–—:,"'|]+$/g, '')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Trending Opportunity';

  // Capitalize first letter of each word if title is all lowercase
  if (cleaned === cleaned.toLowerCase()) {
    cleaned = cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return cleaned;
}

/**
 * Sanitizes description text (Why Predicted, Action Plan, Growth Tips) by stripping hashtags.
 */
export function cleanTrendText(text?: string | null): string {
  if (!text) return '';

  return text
    // Remove hashtags (e.g. #shorts, #unboxing, #m3)
    .replace(/#\w+/gi, '')
    // Remove orphan # symbols
    .replace(/#/g, '')
    // Remove multi-spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a concept or angle is a generic boilerplate string.
 */
export function isBoilerplateConcept(text?: string | null): boolean {
  if (!text || !text.trim()) return true;
  const lower = text.toLowerCase().trim();
  if (lower.startsWith('react to or remix')) return true;
  if (lower.startsWith('test the viral')) return true;
  if (lower.includes('with your own conversational spin')) return true;
  if (lower.includes('with your own energetic spin')) return true;
  if (lower.includes('with your own mixed spin')) return true;
  if (lower.includes('with your own humorous spin')) return true;
  if (lower.includes('with your own educational spin')) return true;
  if (lower.includes('with your own')) return true;
  if (lower.startsWith('rising in ') && lower.includes('worth a')) return true;
  return false;
}

/**
 * Deterministic string hash for consistent template rotation without flicker.
 */
function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface TrendConceptMeta {
  concept: string;
  badge: string;
}

export interface TrendLike {
  id?: string | number | null;
  video_concept?: string | null;
  content_angle?: string | null;
  action_plan?: string | null;
  growth_tip?: string | null;
  headline?: string | null;
  topic?: string | null;
  niches?: string[] | null;
  supported_formats?: string[] | null;
  archetype?: string | null;
  opportunity_score?: number | null;
  tvs_score?: number | null;
}

const SHORTS_TEMPLATES: { badge: string; template: (title: string, niche: string) => string }[] = [
  {
    badge: 'Shorts Hook',
    template: (title, niche) => `Hook: "Wait till the end..." Test "${title}" with a real-time before & after comparison for ${niche} viewers.`,
  },
  {
    badge: 'POV Skit',
    template: (title) => `POV: Trying the "${title}" trend for the very first time without watching a tutorial.`,
  },
  {
    badge: 'Speed Challenge',
    template: (title) => `The 60-Second Challenge: Can you pull off "${title}" in real time with zero cuts?`,
  },
  {
    badge: 'Myth Buster',
    template: (title) => `Is "${title}" actually legit? Test the viral claim in 45 seconds with instant proof.`,
  },
  {
    badge: 'Behind The Scenes',
    template: (title) => `Behind the scenes of "${title}": Film what actually happens off-camera in a rapid 30s cut.`,
  },
  {
    badge: 'Side-by-Side',
    template: (title, niche) => `Expectation vs Reality: The "${title}" trend executed by a beginner vs. a pro ${niche} creator.`,
  },
  {
    badge: 'Pro Tip',
    template: (title) => `The 1 trick everyone misses with "${title}" — reveal and demonstrate the fix in the opening 3 seconds.`,
  },
  {
    badge: 'Honest Review',
    template: (title) => `Testing "${title}" so you don't have to — give your raw, unfiltered verdict on a 1-to-10 scale.`,
  },
];

const LONG_FORM_TEMPLATES: { badge: string; template: (title: string, niche: string) => string }[] = [
  {
    badge: 'Deep Dive',
    template: (title, niche) => `The Rise and Impact of "${title}": An investigative breakdown of why this captivated ${niche} viewers.`,
  },
  {
    badge: 'Masterclass',
    template: (title, niche) => `The Ultimate Guide to "${title}": Step-by-step masterclass covering every detail for ${niche} creators.`,
  },
  {
    badge: 'Case Study',
    template: (title) => `I Tested "${title}" for 7 Days Straight — Here is what happened to my stats and audience reach.`,
  },
  {
    badge: 'Tier List',
    template: (title) => `Tier List: Ranking every single variation and technique of "${title}" from worst to god-tier.`,
  },
  {
    badge: 'Investigation',
    template: (title) => `The Truth About "${title}" Nobody Is Telling You: Unfiltered breakdown backed by real evidence.`,
  },
  {
    badge: 'Step-by-Step',
    template: (title, niche) => `Mastering "${title}" from scratch: 0 to 100 complete walkthrough for serious ${niche} creators.`,
  },
];

/**
 * Resolves both the concept text and an archetype badge for high-impact display.
 */
export function resolveVideoConceptMeta(trend: TrendLike): TrendConceptMeta {
  const isShorts =
    trend.supported_formats?.includes('shorts') ||
    !trend.supported_formats?.includes('long_form');

  // Check if a custom, non-boilerplate AI concept already exists
  if (trend.video_concept && !isBoilerplateConcept(trend.video_concept)) {
    return {
      concept: cleanTrendText(trend.video_concept),
      badge: isShorts ? 'Shorts Hook' : 'Video Concept',
    };
  }
  if (trend.content_angle && !isBoilerplateConcept(trend.content_angle)) {
    return {
      concept: cleanTrendText(trend.content_angle),
      badge: isShorts ? 'Shorts Hook' : 'Editorial Angle',
    };
  }

  const title = cleanTrendTitle(trend.topic);
  const niche = trend.niches?.[0] || 'creators';
  const templates = isShorts ? SHORTS_TEMPLATES : LONG_FORM_TEMPLATES;

  // Seed hash with id and title to guarantee diversity across adjacent cards
  const seed = `${trend.id || ''}:${trend.topic || ''}`;
  const idx = stringHash(seed) % templates.length;
  const chosen = templates[idx];

  return {
    concept: chosen.template(title, niche),
    badge: chosen.badge,
  };
}

/**
 * Resolves or synthesizes a clean, diverse, high-impact video concept string for a trend card.
 */
export function resolveVideoConcept(trend: TrendLike): string {
  return resolveVideoConceptMeta(trend).concept;
}

/**
 * Resolves the badge pill for a trend card's video concept block.
 */
export function resolveVideoConceptBadge(trend: TrendLike): string {
  return resolveVideoConceptMeta(trend).badge;
}

/**
 * Resolves a punchy, varied subtitle/headline, replacing generic "Rising in X — worth a Y video"
 */
export function cleanTrendHeadline(trend: TrendLike): string {
  if (trend.headline && !isBoilerplateConcept(trend.headline)) {
    return cleanTrendText(trend.headline);
  }

  const niche = trend.niches?.[0] || 'creators';
  const seed = `${trend.id || ''}:${trend.topic || ''}`;
  const HEADLINES = [
    `Peaking Search Velocity — High Virality Potential in ${niche}`,
    `Early Breakout Signal — Low Competition Opportunity in ${niche}`,
    `Audience Demand Surge — Perfect for High Retention`,
    `Fast-Growing Topic — Ride the Early Discovery Wave`,
    `Untapped Search Angle — Strong Viewer Retention Signal`,
    `Viral Momentum Detected — High Click-Through Rate Window`,
  ];
  const idx = stringHash(seed) % HEADLINES.length;
  return HEADLINES[idx];
}

