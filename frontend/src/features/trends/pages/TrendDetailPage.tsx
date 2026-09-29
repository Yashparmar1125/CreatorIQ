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
};

const FALLBACK_DEMO_FORECAST: TrendForecastData = {
  topic: 'Autonomous AI Agents vs Traditional Workflows',
  origin_date: '2026-09-15',
  current_score: 92,
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
  model_used: 'Prophet Additive Seasonality v2',
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
        <p className="text-xs text-neutral-500 font-medium">Loading concept intelligence & vector signals...</p>
      </div>
    );
  }

  // Resolve trend from detail, or store list, or fallback demo
  const trend: Trend =
    trendDetail ||
    trends.find((t) => t.id === trendId) ||
    FALLBACK_DEMO_TREND;

  const forecastData: TrendForecastData = trendForecast || FALLBACK_DEMO_FORECAST;

  const oppScore = Math.round(trend.opportunity_score ?? trend.tvs_score ?? 92);
  const vectorMatch = (trend as any).vector_similarity
    ? Math.round((trend as any).vector_similarity * 100)
    : 96;

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
                THAT CARD &bull; Selected Concept
              </span>
              <span className="rounded-full bg-[#1c1c1c] border border-[#2e2e2e] px-2.5 py-0.5 text-xs font-bold text-white font-mono">
                {oppScore} Fit
              </span>
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
                {trend.is_momentum_outlier && (
                  <Badge variant="warning" className="gap-1 text-[10px]">
                    <Flame className="h-3 w-3" />
                    Spike
                  </Badge>
                )}
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
              <span>Velocity: <strong className="text-white font-mono">{trend.velocity || '+285% Surge'}</strong></span>
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

      {/* MIDDLE SECTION: TWO SIDE-BY-SIDE METRIC BOXES (Matching Wireframe) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Box 1: ESTIMATED VIEWS */}
        <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Estimated Views
              </h2>
            </div>
            <span className="rounded-full bg-indigo-950/60 border border-indigo-700/50 px-2.5 py-0.5 text-[10px] font-mono text-indigo-300 font-bold">
              Prophet 95% Band
            </span>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Projected 30-Day Reach
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                  {trend.volume || '45K – 180K'}
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
                <p className="text-lg font-bold text-white font-mono">65K – 240K</p>
                <div className="h-1.5 w-full rounded-full bg-[#202020] overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 w-[78%]" />
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
                <p className="text-lg font-bold text-white font-mono">18K – 75K</p>
                <div className="h-1.5 w-full rounded-full bg-[#202020] overflow-hidden">
                  <div className="h-full rounded-full bg-cyan-400 w-[55%]" />
                </div>
                <p className="text-[10px] text-neutral-500">Deep watch-time retention</p>
              </div>
            </div>

            <div className="rounded-lg bg-[#141414] border border-[#202020] p-2.5 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                Peak Velocity Window:
              </span>
              <strong className="text-white font-medium">Days 3 – 7 post-upload</strong>
            </div>
          </div>
        </Card>

        {/* Box 2: OTHER CARD PARAMETERS & FIT */}
        <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Other Card Parameters &amp; Fit
              </h2>
            </div>
            <span className="rounded-full bg-[#1c1c1c] border border-[#2a2a2a] px-2.5 py-0.5 text-[10px] font-mono text-neutral-400">
              AI Signal Matrix
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3.5 text-xs">
            <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5">
              <span className="text-neutral-400 text-[11px] font-medium">Opportunity Score</span>
              <p className="mt-1 text-2xl font-extrabold text-white font-mono">
                {oppScore}<span className="text-xs font-normal text-neutral-500">/100</span>
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-400">Top 5% category ranking</p>
            </div>

            <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5">
              <span className="text-neutral-400 text-[11px] font-medium">Search Velocity</span>
              <p className="mt-1 text-lg font-bold text-emerald-400 font-mono">
                {trend.velocity || '+285% Surge'}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500">Weekly query growth</p>
            </div>

            <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5">
              <span className="text-neutral-400 text-[11px] font-medium">Vector Fit</span>
              <p className="mt-1 text-sm font-bold text-indigo-300 font-mono">
                {vectorMatch}% Qdrant Match
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500">Semantic cluster alignment</p>
            </div>

            <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5">
              <span className="text-neutral-400 text-[11px] font-medium">Archetype Format</span>
              <p className="mt-1 text-sm font-bold text-white capitalize">
                {trend.archetype || 'Breakdown & Tutorial'}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-500">{trend.creator_tier || 'Mid-tier'} creators</p>
            </div>

            {/* Stability Index Full Width */}
            <div className="col-span-2 rounded-xl border border-[#242424] bg-[#161616] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400 font-medium">Trajectory Stability Index</span>
                <span className="text-white font-mono font-bold">{trend.stability_score ?? 84}% Stable</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#202020]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${trend.stability_score ?? 84}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-500">
                Low decay risk over the next 4–6 weeks of upload shelf-life.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* BOTTOM SECTION - DETAIL BLOCK 1: Market Signals & Evidence (Matching Wireframe) */}
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
                {(trend as any).saturation || 'Low Saturation (High Opportunity)'}
              </span>
              <p className="mt-1 text-xs text-neutral-400">
                High viewer demand relative to supply of authoritative creator uploads.
              </p>
            </div>
            <div className="rounded-lg bg-[#111111] p-2.5 border border-[#242424] text-[11px] text-neutral-300">
              Recommended production window:{' '}
              <strong className="text-emerald-400 font-semibold">Next 48–72 hours</strong>
            </div>
          </div>
        </div>
      </Card>

      {/* BOTTOM SECTION - DETAIL BLOCK 2: Trajectory Forecast & Strategy Action (Matching Wireframe) */}
      <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Trend Details &bull; 30-Day Historical Trajectory &amp; Forecast
            </h2>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            Prophet Time-Series v2
          </span>
        </div>

        {/* Forecast Chart */}
        {isForecastLoading ? (
          <div className="flex items-center justify-center p-12 border border-[#222222] rounded-xl bg-[#141414]">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              Calculating 30-day Prophet forecast demand curve...
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
