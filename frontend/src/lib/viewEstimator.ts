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

interface ForecastInput {
  current_score?: number;
  horizons?: {
    '1_week'?: { forecast_score?: number; change_pct?: number; direction?: string };
    '1_month'?: { forecast_score?: number; change_pct?: number; direction?: string };
    '3_months'?: { forecast_score?: number; change_pct?: number; direction?: string };
  };
  metrics?: {
    avg_velocity?: number;
    avg_acceleration?: number;
    uncertainty?: string;
  };
}

interface TrendEstimatorInput {
  topic?: string | null;
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
export function calculateViewPossibilities(
  trend: TrendEstimatorInput,
  forecast?: ForecastInput | null
): ViewPossibilityResult {
  const baseVolume = parseVolumeToNumber(trend.volume, trend.search_volume);
  const tier = (trend.creator_tier || 'medium').toLowerCase();
  const score = trend.opportunity_score ?? trend.tvs_score ?? forecast?.current_score ?? 60;
  const isShorts =
    trend.supported_formats?.includes('shorts') ||
    !trend.supported_formats?.includes('long_form');
  const niche = trend.niches?.[0] || 'your niche';

  // Parse views/hr from velocity string like "8.1M views · 56K/hr" or "64K/hr"
  let vph = 0;
  if (trend.velocity) {
    const vphMatch = trend.velocity.match(/([\d.]+)\s*([KMkm])?\/hr/i);
    if (vphMatch) {
      const num = parseFloat(vphMatch[1]);
      const unit = (vphMatch[2] || '').toUpperCase();
      vph = unit === 'M' ? num * 1_000_000 : (unit === 'K' ? num * 1_000 : num);
    }
  }

  // Factor in 1-week forecast trajectory growth from Prophet
  const weekChangePct = forecast?.horizons?.['1_week']?.change_pct ?? (vph > 20_000 ? 12.0 : 5.0);

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

  // Dynamic score & velocity scaling factor
  const scoreScale = 0.65 + (score / 100) * 0.7;
  const growthBoost = 1.0 + Math.max(-0.15, Math.min(0.5, weekChangePct / 100.0));

  // Calculate base min/max views with authentic volume proportionality
  let minViews = Math.round(baseVolume * minPct * scoreScale * growthBoost);
  let maxViews = Math.round(baseVolume * maxPct * scoreScale * growthBoost);

  // Minimum baseline sanity
  minViews = Math.max(1_200, minViews);
  maxViews = Math.max(minViews + 2_500, maxViews);

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

  // Precise Continuous Reach Multiplier
  const rawMult = 1.2 + (score / 100) * 2.0 + Math.max(0, weekChangePct) * 0.012;
  const roundedMult = (Math.round(rawMult * 10) / 10).toFixed(1);
  const reachMultiplier = `${roundedMult}x Channel Average`;

  let reachDescription = `Consistent ${roundedMult}x Discovery in ${niche}`;
  if (rawMult >= 3.0) {
    const topPct = Math.max(2, Math.round(14 - (score - 60) * 0.4));
    reachDescription = `Top ${topPct}% Virality Velocity in ${niche}`;
  } else if (rawMult >= 2.2) {
    const surgePct = Math.round((score - 40) * 3.2 + Math.max(0, weekChangePct) * 0.8);
    reachDescription = `+${surgePct}% Search Demand Spike in ${niche}`;
  }

  // Dynamic Optimal Publishing Window & Urgency
  let optimalWindow = 'Next 5 – 7 Days';
  let urgency = 'High Discovery Window';
  let windowAdvice = 'Publish within 7 days before search volume begins to plateau.';

  if (vph >= 50_000 || score >= 74) {
    optimalWindow = 'Next 24 – 48 Hours';
    urgency = 'Peak Breakout Urgency';
    windowAdvice = vph > 0
      ? `Surging at ${formatCompactNumber(vph)} views/hr across YouTube. Fast-turnaround Shorts will capture peak traffic.`
      : `At peak algorithm velocity. Releasing within 48 hours maximizes top-of-feed placement.`;
  } else if (vph >= 20_000 || score >= 68) {
    optimalWindow = 'Next 2 – 4 Days';
    urgency = 'High Velocity Window';
    windowAdvice = vph > 0
      ? `Strong momentum (${formatCompactNumber(vph)} views/hr). Releasing this week captures active recommendations.`
      : `High audience interest. Deploy content within 4 days to ride the algorithm spike.`;
  } else if (vph >= 5_000 || score >= 55) {
    optimalWindow = 'Next 4 – 7 Days';
    urgency = 'Early Wave Opportunity';
    windowAdvice = 'Audience search momentum is climbing. Early movers capture high search ranking.';
  } else {
    optimalWindow = 'Next 1 – 2 Weeks';
    urgency = 'Sustained Opportunity';
    windowAdvice = 'Consistent monthly watch-time interest. High long-term search retention.';
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
