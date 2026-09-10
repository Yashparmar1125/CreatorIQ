export interface ViewPossibilityResult {
  primaryRangeLabel: string;
  minViews: number;
  maxViews: number;
  shortsRangeLabel: string;
  longFormRangeLabel: string;
  reachMultiplier: string;
  reachDescription: string;
  optimalWindow: string;
  urgency: string;
  windowAdvice: string;
  volumeParsed: string;
  explainabilityPoints: { title: string; desc: string }[];
}

interface TrendEstimatorInput {
  volume?: string | null;
  search_volume?: number | null;
  velocity?: string | null;
  creator_tier?: 'small' | 'medium' | 'big' | string | null;
  supported_formats?: string[] | null;
  archetype?: string | null;
  opportunity_score?: number | null;
  tvs_score?: number | null;
  niches?: string[] | null;
}

/**
 * Parses volume strings like "3.0M", "863K", "45K", "1,200,000" into numeric values.
 */
export function parseVolumeToNumber(volStr?: string | null, rawNum?: number | null): number {
  if (rawNum && rawNum > 0) return rawNum;
  if (!volStr) return 150_000;

  const clean = volStr.trim().toUpperCase().replace(/,/g, '');
  const mMatch = clean.match(/([\d.]+)\s*M/);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1_000_000);

  const kMatch = clean.match(/([\d.]+)\s*K/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1_000);

  const num = parseFloat(clean);
  if (!isNaN(num) && num > 0) return Math.round(num);

  return 150_000;
}

/**
 * Formats numbers into human-readable shorthand (e.g. 25,000 -> 25K, 1,200,000 -> 1.2M)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return val >= 10 ? `${Math.round(val)}M` : `${val.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return val >= 10 ? `${Math.round(val)}K` : `${val.toFixed(1).replace(/\.0$/, '')}K`;
  }
  return num.toLocaleString();
}

/**
 * Calculates realistic, transparent view possibilities and reach metrics for a trend.
 */
export function calculateViewPossibilities(trend: TrendEstimatorInput): ViewPossibilityResult {
  const baseVolume = parseVolumeToNumber(trend.volume, trend.search_volume);
  const tier = (trend.creator_tier || 'medium').toLowerCase();
  const score = trend.opportunity_score ?? trend.tvs_score ?? 60;
  const isShorts =
    trend.supported_formats?.includes('shorts') ||
    !trend.supported_formats?.includes('long_form');
  const niche = trend.niches?.[0] || 'your niche';

  // Tier capture percentages of search/recommendation pool
  let minPct = 0.02;
  let maxPct = 0.055;
  let tierName = 'Medium Tier (10K–100K subs)';

  if (tier === 'small') {
    minPct = 0.008;
    maxPct = 0.025;
    tierName = 'Emerging Creator (<10K subs)';
  } else if (tier === 'big') {
    minPct = 0.05;
    maxPct = 0.14;
    tierName = 'Established Creator (>100K subs)';
  }

  // Calculate base min/max views
  let minViews = Math.round(baseVolume * minPct);
  let maxViews = Math.round(baseVolume * maxPct);

  // Ensure minimum baseline sanity
  minViews = Math.max(1_500, minViews);
  maxViews = Math.max(minViews + 3_000, maxViews);

  // Shorts vs Long-Form breakdowns
  const shortsMin = Math.round(minViews * 1.35);
  const shortsMax = Math.round(maxViews * 1.45);
  const longMin = Math.round(minViews * 0.85);
  const longMax = Math.round(maxViews * 0.95);

  const activeMin = isShorts ? shortsMin : longMin;
  const activeMax = isShorts ? shortsMax : longMax;

  const primaryRangeLabel = `${formatCompactNumber(activeMin)} – ${formatCompactNumber(activeMax)} Views`;
  const shortsRangeLabel = `${formatCompactNumber(shortsMin)} – ${formatCompactNumber(shortsMax)}`;
  const longFormRangeLabel = `${formatCompactNumber(longMin)} – ${formatCompactNumber(longMax)}`;

  // Reach Multiplier based on score and velocity
  let reachMultiplier = '2.4x Channel Average';
  let reachDescription = '+180% Search Velocity Surge';

  if (score >= 75) {
    reachMultiplier = '3.2x Channel Average';
    reachDescription = 'Top 5% Virality Velocity in ' + niche;
  } else if (score >= 65) {
    reachMultiplier = '2.4x Channel Average';
    reachDescription = 'Strong Search Discovery Spike';
  } else if (score >= 50) {
    reachMultiplier = '1.8x Channel Average';
    reachDescription = 'Consistent Algorithmic Demand';
  } else {
    reachMultiplier = '1.4x Channel Average';
    reachDescription = 'Steady Niche Audience Interest';
  }

  // Optimal Publishing Window & Urgency
  const archetype = (trend.archetype || '').toLowerCase();
  let optimalWindow = 'Next 5 – 7 Days';
  let urgency = 'High Discovery Window';
  let windowAdvice = 'Publish within 7 days before search volume begins to plateau.';

  if (archetype.includes('spike') || archetype.includes('peaking')) {
    optimalWindow = 'Next 48 – 96 Hours';
    urgency = 'Peak Urgency';
    windowAdvice = 'Topic is at peak virality. Quick-turnaround Shorts will capture the algorithm peak.';
  } else if (archetype.includes('discovery') || archetype.includes('emerging')) {
    optimalWindow = 'Next 7 – 14 Days';
    urgency = 'Early Wave Opportunity';
    windowAdvice = 'Search momentum is building. Early movers will capture top YouTube search rankings.';
  } else if (archetype.includes('evergreen')) {
    optimalWindow = 'Anytime (Sustained)';
    urgency = 'Evergreen Demand';
    windowAdvice = 'Consistent monthly search volume. High cumulative long-term watch time.';
  }

  // Explainability Points
  const explainabilityPoints = [
    {
      title: 'YouTube Topic Volume',
      desc: `${formatCompactNumber(baseVolume)} monthly search & engagement queries tracked across YouTube search.`,
    },
    {
      title: 'Channel Scale Capture',
      desc: `Calibrated for ${tierName} with estimated ${(minPct * 100).toFixed(1)}%–${(maxPct * 100).toFixed(1)}% audience capture.`,
    },
    {
      title: 'Format Algorithmic Push',
      desc: isShorts
        ? 'Shorts feed algorithm multiplier (1.35x) applied for rapid top-of-funnel discovery.'
        : 'Long-form retention benchmark applied for high-depth subscriber conversion.',
    },
  ];

  return {
    primaryRangeLabel,
    minViews: activeMin,
    maxViews: activeMax,
    shortsRangeLabel,
    longFormRangeLabel,
    reachMultiplier,
    reachDescription,
    optimalWindow,
    urgency,
    windowAdvice,
    volumeParsed: formatCompactNumber(baseVolume),
    explainabilityPoints,
  };
}
