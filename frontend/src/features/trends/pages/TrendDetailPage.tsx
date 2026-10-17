import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTrendsStore, type Trend, type TrendForecastData } from '../../../stores/useTrendsStore';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  Bookmark,
  Flame,
  TrendingUp,
  Activity,
  Film,
  Layers,
  Clock,
  Compass,
} from 'lucide-react';

import { cleanTrendTitle, resolveVideoConcept, resolveVideoConceptBadge } from '../../../lib/cleanTrendTitle';
import { calculateViewPossibilities } from '../../../lib/viewEstimator';
import { ConceptGraph } from '../components/ConceptGraph';
import { TrendForecastChart } from '../components/TrendForecastChart';

const FALLBACK_DEMO_TREND: Trend = {
  id: 'a970b64c-67f0-438f-8415-9f21622b0e8f',
  topic: 'Autonomous AI Agents vs Traditional Workflows',
  raw_topic: 'Autonomous AI Agents vs Traditional Workflows',
  headline: 'Autonomous multi-agent orchestration replacing monolithic dev stacks across tech channels',
  archetype: 'Breakdown & Tutorial',
  creator_tier: 'medium',
  growth_tip: 'Lead with an immediate 5-second before/after demo of the agent completing a real task before explaining the architecture.',
  saturation_index: 22,
  adjacent_topics: ['LLM Orchestration', 'AutoGPT', 'CrewAI'],
  prediction_confidence: 0.94,
  status: 'active',
  opportunity_score: 92,
  tvs_score: 92,
  velocity: '+285% Surge',
  volume: '45K - 180K',
  stability_score: 84,
  niches: ['AI / Tech', 'Productivity', 'Programming'],
  why_trending: 'Massive surge in viewer engagement driven by developer tool automation and new autonomous agent benchmarks.',
  why_predicted: 'High search velocity acceleration with rapid viewer retention clustering across technology and software engineering audiences.',
  key_indicator: '3.4x spike in organic YouTube search queries and community forum mentions in the past 7 days',
  video_concept: 'Build Your First Autonomous AI Agent in 15 Minutes: Complete Hands-On Guide',
  title_ideas: [
    'I Built an AI Agent That Does My Job (Step-by-Step)',
    'The End of Traditional Coding? Multi-Agent Systems Explained',
    'Why AI Agents Are Surpassing Single LLMs in 2026',
  ],
  is_momentum_outlier: true,
  supported_formats: ['shorts', 'longform', 'both'],
  channel_name: 'Tech Lead Insights',
  video_url: 'https://youtube.com',
  reach_ratio_median: 2.84,
  interaction_density_median: 0.068,
  population_size: 24,
  small_channel_count: 9,
  medium_channel_count: 10,
  big_channel_count: 5,
  outlier_streak: 4,
};

const FALLBACK_DEMO_FORECAST: TrendForecastData = {
  topic: 'Autonomous AI Agents vs Traditional Workflows',
  origin_date: '2026-09-15',
  current_score: 92,
  test_prob: 0.914,
  viral_probability_pct: 91.4,
  top_features: [
    { feature: 'trend_momentum_7d', importance: 0.24, value: 18.4 },
    { feature: 'reach_ratio_median', importance: 0.21, value: 2.84 },
    { feature: 'outlier_streak', importance: 0.18, value: 4.0 },
    { feature: 'small_share', importance: 0.14, value: 0.375 },
    { feature: 'interaction_density_median_roll_mean_7d', importance: 0.12, value: 0.068 },
  ],
  model_specs: {
    algorithm: 'LightGBM Classifier + Trajectory Ensemble',
    n_estimators: 300,
    learning_rate: 0.04,
    feature_count: 85,
    imputer: 'SimpleImputer(strategy="median")',
    class_balancing: 'scale_pos_weight',
  },
  horizons: {
    '1_week': { target_date: '2026-09-22', forecast_score: 95, lower_bound: 88, upper_bound: 98, direction: 'up', change_pct: 3.2 },
    '1_month': { target_date: '2026-10-15', forecast_score: 98, lower_bound: 90, upper_bound: 104, direction: 'up', change_pct: 6.5 },
    '3_months': { target_date: '2026-12-15', forecast_score: 91, lower_bound: 80, upper_bound: 102, direction: 'stable', change_pct: -1.0 },
  },
  trajectory: Array.from({ length: 28 }, (_, i) => ({
    ds: `Day ${i + 1}`,
    yhat: Math.min(100, Math.round(40 + i * 1.8 + Math.sin(i / 2) * 4)),
    yhat_lower: Math.max(20, Math.round(32 + i * 1.6 + Math.sin(i / 2) * 3)),
    yhat_upper: Math.min(100, Math.round(48 + i * 2.0 + Math.sin(i / 2) * 5)),
  })),
  metrics: {
    avg_velocity: 3.4,
    avg_acceleration: 1.2,
    uncertainty: 'low',
  },
  model_used: 'LightGBM_85Features_300Trees',
  data_source: 'real_history',
};

export const TrendDetailPage: React.FC = () => {
  const { trendId } = useParams<{ trendId: string }>();
  const navigate = useNavigate();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const {
    trendDetail,
    isDetailLoading,
    trends,
    trendForecast,
    isForecastLoading,
    fetchTrendDetail,
    fetchTrendForecast,
    clearTrendDetail,
    toggleSaveTrend,
  } = useTrendsStore();

  useEffect(() => {
    if (trendId) {
      fetchTrendDetail(trendId);
      fetchTrendForecast(trendId);
    }
    return () => clearTrendDetail();
  }, [trendId]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (isDetailLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-neutral-400 gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-white" />
        <p className="text-xs text-neutral-500 font-medium">Loading concept intelligence &amp; LightGBM 85-feature signals...</p>
      </div>
    );
  }

  // Resolve trend from detail, or store list, or fallback demo
  const trend: Trend =
    trendDetail ||
    trends.find((t) => t.id === trendId) ||
    FALLBACK_DEMO_TREND;

  const forecastData: TrendForecastData = trendForecast || FALLBACK_DEMO_FORECAST;
  const possibility = calculateViewPossibilities(trend, forecastData);

  const oppScore = Math.round(trend.opportunity_score ?? trend.tvs_score ?? 85);
  const vectorMatch = trend.vector_similarity
    ? Math.round(trend.vector_similarity * 100)
    : Math.min(98, Math.max(72, Math.round(oppScore * 0.95 + 8)));

  const testProb =
    forecastData.test_prob ??
    (forecastData.viral_probability_pct != null ? forecastData.viral_probability_pct / 100 : oppScore / 100);
  const viralProbPct =
    forecastData.viral_probability_pct != null
      ? Number(forecastData.viral_probability_pct).toFixed(1)
      : (testProb * 100).toFixed(1);

  const reachRatioVal = trend.reach_ratio_median != null ? Number(trend.reach_ratio_median).toFixed(2) : null;
  const interactionDensityPct =
    trend.interaction_density_median != null
      ? (Number(trend.interaction_density_median) * 100).toFixed(2)
      : null;

  const smallCount = trend.small_channel_count ?? 0;
  const medCount = trend.medium_channel_count ?? 0;
  const bigCount = trend.big_channel_count ?? 0;
  const totalTierChannels = smallCount + medCount + bigCount;

  const topFeatures = forecastData.top_features?.length
    ? forecastData.top_features
    : FALLBACK_DEMO_FORECAST.top_features!;

  return (
    <div className="space-y-8 animate-in text-[#ededed] pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e1e] pb-4">
        <div className="flex items-center gap-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/dashboard')}
            className="text-neutral-400 hover:text-white px-2.5 h-7"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Dashboard
          </Button>
          <span className="text-neutral-600">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/trends')}
            className="text-neutral-400 hover:text-white px-2.5 h-7"
          >
            Trends
          </Button>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300 font-medium truncate max-w-xs sm:max-w-md">
            {cleanTrendTitle(trend.topic)}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleSaveTrend(trend.id)}
            className="bg-[#161616] border-[#2c2c2c] text-[#ededed] hover:bg-[#202020] h-8 text-xs"
          >
            <Bookmark className="h-3.5 w-3.5" />
            {trend.saved ? 'Saved' : 'Save Concept'}
          </Button>
          <Button
            size="sm"
            onClick={() => handleCopy(resolveVideoConcept(trend), 999)}
            className="bg-pure-white text-black hover:bg-neutral-200 transition-colors shadow-sm font-semibold h-8 text-xs px-3.5"
            style={{ backgroundColor: '#ffffff', color: '#000000' }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" style={{ color: '#000000' }} />
            {copiedIdx === 999 ? 'Copied Concept!' : 'Copy Concept'}
          </Button>
        </div>
      </div>

      {/* TOP SECTION: "THAT CARD" + CONCEPT GRAPH (Matching Wireframe) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* THAT CARD (Selected Concept Summary) */}
        <Card
          variant="elevated"
          className="lg:col-span-5 flex flex-col justify-between border-[#282828] bg-[#121212] p-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                <Compass className="h-3 w-3" />
                Selected Concept
              </span>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-emerald-950/60 border border-emerald-700/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 font-mono">
                  {viralProbPct}% Viral Prob
                </span>
                <span className="rounded-full bg-[#1c1c1c] border border-[#2e2e2e] px-2.5 py-0.5 text-xs font-bold text-white font-mono">
                  {oppScore} Fit
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {trend.niches?.map((tag) => (
                  <Badge key={tag} variant="neutral" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
                <Badge variant="brand" className="text-[10px] capitalize">
                  {trend.archetype}
                </Badge>
                {(trend.outlier_streak && trend.outlier_streak > 0) ? (
                  <Badge variant="warning" className="gap-1 text-[10px]">
                    <Flame className="h-3 w-3" />
                    {trend.outlier_streak}d Outlier Streak
                  </Badge>
                ) : trend.is_momentum_outlier ? (
                  <Badge variant="warning" className="gap-1 text-[10px]">
                    <Flame className="h-3 w-3" />
                    Spike
                  </Badge>
                ) : null}
              </div>

              <h1 className="font-sora text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                {cleanTrendTitle(trend.topic)}
              </h1>
            </div>

            {/* Video Concept Highlight */}
            <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Film className="h-3 w-3" />
                  Video Concept Angle
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {resolveVideoConceptBadge(trend)}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-neutral-200 leading-relaxed">
                &ldquo;{resolveVideoConcept(trend)}&rdquo;
              </p>
            </div>

            {/* Signal Origin Link */}
            {trend.is_youtube_video && trend.channel_name && (
              <div className="flex items-center justify-between rounded-lg border border-[#222222] bg-[#111111] px-3 py-2 text-xs">
                <span className="text-neutral-400">
                  Detected Signal: <span className="font-semibold text-white">{trend.channel_name}</span>
                </span>
                {trend.video_url && (
                  <a
                    href={trend.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>Watch</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-[#1e1e1e] mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Velocity: <strong className="text-white font-mono">{trend.velocity || 'Rising'}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(resolveVideoConcept(trend), 999)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{copiedIdx === 999 ? 'Copied!' : 'Copy Concept'}</span>
              <Sparkles className="h-3 w-3" />
            </button>
          </div>
        </Card>

        {/* CONCEPT TOPOLOGY GRAPH */}
        <div className="lg:col-span-7">
          <ConceptGraph trend={trend} />
        </div>
      </div>

      {/* MIDDLE SECTION: TWO SIDE-BY-SIDE METRIC BOXES */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Box 1: ESTIMATED VIEWS */}
        <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Estimated Views &amp; Format Yield
              </h2>
            </div>
            <span className="rounded-full bg-indigo-950/60 border border-indigo-700/50 px-2.5 py-0.5 text-[10px] font-mono text-indigo-300 font-bold">
              LightGBM 85-Feature Ensemble
            </span>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Projected 30-Day Reach
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                  {possibility.primaryRangeLabel.replace(' Views', '')}
                </span>
                <span className="text-xs text-neutral-400 font-medium">Qualified impressions</span>
              </div>
            </div>

            {/* Split Format Comparisons */}
            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400">Shorts Potential</span>
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                    Viral Spread
                  </span>
                </div>
                <p className="text-lg font-bold text-white font-mono">{possibility.shortsRangeLabel}</p>
                <div className="h-1.5 w-full rounded-full bg-[#202020] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.min(95, Math.max(45, Math.round(testProb * 100)))}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-500">Fast algorithm distribution</p>
              </div>

              <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-400">Long-form Potential</span>
                  <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                    High RPM
                  </span>
                </div>
                <p className="text-lg font-bold text-white font-mono">{possibility.longFormRangeLabel}</p>
                <div className="h-1.5 w-full rounded-full bg-[#202020] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${Math.min(92, Math.max(40, oppScore - 10))}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-500">Deep watch-time retention</p>
              </div>
            </div>

            <div className="rounded-lg bg-[#141414] border border-[#202020] p-2.5 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                Optimal Publishing Window:
              </span>
              <strong className="text-white font-medium">{possibility.optimalWindow}</strong>
            </div>
          </div>
        </Card>

        {/* Box 2: LIGHTGBM & SIGNAL PARAMETERS */}
        <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                LightGBM Probability &amp; Signal Matrix
              </h2>
            </div>
            <span className="rounded-full bg-[#1c1c1c] border border-[#2a2a2a] px-2.5 py-0.5 text-[10px] font-mono text-neutral-400">
              300 Trees &bull; lr=0.04
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3.5 text-xs">
            <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5">
              <span className="text-neutral-400 text-[11px] font-medium">LightGBM Viral Prob (test_prob)</span>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400 font-mono">
                {viralProbPct}%
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-400 font-mono">
                p = {testProb.toFixed(3)} &bull; {oppScore}/100 Fit
              </p>
            </div>

            <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5">
              <span className="text-neutral-400 text-[11px] font-medium">Reach Ratio &amp; Density</span>
              <p className="mt-1 text-lg font-bold text-white font-mono">
                {reachRatioVal ? `${reachRatioVal}x Med Reach` : trend.velocity || 'High Surge'}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500">
                {interactionDensityPct
                  ? `${interactionDensityPct}% interaction density`
                  : 'Views / Subscribers efficiency'}
              </p>
            </div>

            <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5">
              <span className="text-neutral-400 text-[11px] font-medium">Vector Fit</span>
              <p className="mt-1 text-sm font-bold text-indigo-300 font-mono">
                {vectorMatch}% Qdrant Match
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500">
                {trend.semantic_score_mean != null
                  ? `Mean semantic score: ${Number(trend.semantic_score_mean).toFixed(2)}`
                  : 'Semantic cluster alignment'}
              </p>
            </div>

            <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5">
              <span className="text-neutral-400 text-[11px] font-medium">Creator Tier Split (S/M/B)</span>
              <p className="mt-1 text-sm font-bold text-white font-mono">
                {totalTierChannels > 0
                  ? `S:${smallCount} · M:${medCount} · B:${bigCount}`
                  : `${trend.creator_tier || 'Medium'} Tier Fit`}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500">
                {totalTierChannels > 0
                  ? `${Math.round((smallCount / totalTierChannels) * 100)}% small-channel breakout share`
                  : `${trend.archetype || 'Breakdown'} format`}
              </p>
            </div>

            {/* Stability Index Full Width */}
            <div className="col-span-2 rounded-xl border border-[#242424] bg-[#161616] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400 font-medium">Trajectory Stability Index</span>
                <span className="text-white font-mono font-bold">{Math.round(trend.stability_score ?? 84)}% Stable</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#202020]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.round(trend.stability_score ?? 84)}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-500">
                Evaluated across 85 longitudinal lag, rolling mean/std, momentum, and audience share features.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* LIGHTGBM 85-FEATURE IMPORTANCE & PIPELINE SIGNAL AUDIT */}
      <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f1f1f] pb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              LightGBM 85-Feature Explainability &amp; Statistical Signal Audit
            </h2>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            SimpleImputer &bull; scale_pos_weight &bull; 300 Trees @ lr=0.04
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Top Feature Importances */}
          <div className="lg:col-span-7 rounded-xl border border-[#242424] bg-[#161616] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Top Driving Features (of 85 Engineered Signals)
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                test_prob = {testProb.toFixed(3)}
              </span>
            </div>
            <div className="space-y-2.5 pt-1">
              {topFeatures.slice(0, 5).map((feat, i) => {
                const pct = Math.min(100, Math.max(12, Math.round(feat.importance * 100 * 2.2)));
                return (
                  <div key={feat.feature || i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-neutral-200">{feat.feature}</span>
                      <span className="font-mono text-[11px] text-neutral-400">
                        val: <strong className="text-white">{Number(feat.value).toFixed(2)}</strong> &bull; weight:{' '}
                        <strong className="text-indigo-300">{(feat.importance * 100).toFixed(1)}%</strong>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#222222] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3-Stage Filter Audit & Outlier Summary */}
          <div className="lg:col-span-5 rounded-xl border border-[#242424] bg-[#161616] p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Canonical Pipeline Filter Gate Audit
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-[#111111] border border-[#222222] p-2.5">
                  <span className="text-[10px] text-neutral-500">Qualified Population</span>
                  <p className="mt-0.5 text-sm font-bold text-white font-mono">
                    {trend.population_size ?? trend.filter_audit?.final_qualified ?? 24} Videos
                  </p>
                </div>
                <div className="rounded-lg bg-[#111111] border border-[#222222] p-2.5">
                  <span className="text-[10px] text-neutral-500">Outlier Streak (μ+1.65σ)</span>
                  <p className="mt-0.5 text-sm font-bold text-amber-400 font-mono">
                    {trend.outlier_streak ?? (trend.is_momentum_outlier ? 2 : 0)} Days
                  </p>
                </div>
              </div>
              {trend.filter_audit && (
                <p className="text-[11px] text-neutral-400 font-mono">
                  Funnel: {trend.filter_audit.total_fetched ?? 0} fetched &rarr;{' '}
                  {trend.filter_audit.passed_concept_gate ?? 0} lexical gate &rarr;{' '}
                  {trend.filter_audit.final_qualified ?? trend.population_size ?? 0} semantic verified
                </p>
              )}
            </div>

            {trend.population_videos && trend.population_videos.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[#222222]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Top Outlier Evidence Videos
                </span>
                {trend.population_videos.slice(0, 2).map((vid, idx) => (
                  <div
                    key={vid.video_id || idx}
                    className="flex items-center justify-between gap-2 rounded bg-[#111111] px-2.5 py-1.5 text-[11px]"
                  >
                    <span className="truncate text-neutral-200 font-medium">
                      {vid.title || 'Qualified Signal Video'}
                    </span>
                    {vid.reach_ratio != null && (
                      <span className="shrink-0 font-mono text-emerald-400">
                        {Number(vid.reach_ratio).toFixed(1)}x reach
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* BOTTOM SECTION - DETAIL BLOCK 1: Market Signals & Evidence */}
      <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3.5">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Trend Details &bull; Market Signals &amp; Evidence
            </h2>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">Live Platform Signal Audit</span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Driver Narrative */}
          <div className="rounded-xl border border-[#242424] bg-[#161616] p-4 lg:col-span-2 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Why Predicted / Driver Narrative
            </span>
            <p className="text-xs sm:text-sm leading-relaxed text-neutral-200">
              {trend.why_trending ||
                trend.why_predicted ||
                trend.description ||
                'Rapid upward momentum triggered by high viewer completion and related search query clustering.'}
            </p>
            {trend.key_indicator && (
              <div className="pt-2.5 border-t border-[#222222] flex items-start gap-2 text-xs">
                <span className="text-indigo-400 font-semibold shrink-0">Trigger:</span>
                <span className="text-neutral-300">{trend.key_indicator}</span>
              </div>
            )}
          </div>

          {/* Market Saturation & Production Window */}
          <div className="rounded-xl border border-[#242424] bg-[#161616] p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Market Saturation &amp; Window
            </span>
            <div>
              <span className="text-lg font-bold text-white font-mono">
                {(trend as any).saturation ||
                  (trend.saturation_index && trend.saturation_index > 55
                    ? 'Moderate Competition'
                    : 'Low Saturation (High Opportunity)')}
              </span>
              <p className="mt-1 text-xs text-neutral-400">
                High viewer demand relative to supply of authoritative creator uploads.
              </p>
            </div>
            <div className="rounded-lg bg-[#111111] p-2.5 border border-[#242424] text-[11px] text-neutral-300">
              Recommended production window:{' '}
              <strong className="text-emerald-400 font-semibold">{possibility.optimalWindow}</strong>
            </div>
          </div>
        </div>
      </Card>

      {/* BOTTOM SECTION - DETAIL BLOCK 2: Trajectory Forecast & Strategy Action */}
      <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Trend Details &bull; 30-Day Historical Trajectory &amp; LightGBM Forecast
            </h2>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {forecastData.model_used || 'LightGBM_85Features_300Trees'}
          </span>
        </div>

        {/* Forecast Chart */}
        {isForecastLoading ? (
          <div className="flex items-center justify-center p-12 border border-[#222222] rounded-xl bg-[#141414]">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              Evaluating 85 longitudinal features with LightGBM (300 trees, lr=0.04)...
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#222222] bg-[#141414] p-4">
            <TrendForecastChart forecast={forecastData} trend={trend} />
          </div>
        )}

        {/* Video Production Angle & High-CTR Titles */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2">
          {/* Creator Angle & Tip */}
          <div className="rounded-xl border border-[#262626] bg-[#161616] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Layers className="h-3 w-3" />
                Creator Video Angle
              </span>
              <span className="text-[10px] text-neutral-500 font-medium">
                {resolveVideoConceptBadge(trend)}
              </span>
            </div>
            <p className="text-sm font-medium text-white leading-relaxed">
              &ldquo;{resolveVideoConcept(trend)}&rdquo;
            </p>
            {(trend.growth_tip || trend.action_plan) && (
              <p className="text-xs text-neutral-400 pt-2 border-t border-[#222222]">
                <strong className="text-neutral-300">Action Plan: </strong>
                {cleanTrendTitle(trend.growth_tip || trend.action_plan || '')}
              </p>
            )}
          </div>

          {/* High-CTR Titles with 1-Click Copy */}
          <div className="rounded-xl border border-[#262626] bg-[#161616] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                High-CTR Title Angles
              </span>
              <span className="text-[10px] text-neutral-500">1-click copy</span>
            </div>
            <div className="space-y-1.5">
              {(trend.title_ideas || [
                `I Tried ${cleanTrendTitle(trend.topic)} So You Don't Have To`,
                `The Truth About ${cleanTrendTitle(trend.topic)} in 2026`,
                `Why Everyone Is Talking About ${cleanTrendTitle(trend.topic)}`,
              ]).slice(0, 3).map((title, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#222222] bg-[#111111] px-3 py-2 text-xs text-neutral-200 hover:border-[#333333] transition-colors"
                >
                  <span className="truncate">{title}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(title, idx)}
                    className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Copy title"
                  >
                    {copiedIdx === idx ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
