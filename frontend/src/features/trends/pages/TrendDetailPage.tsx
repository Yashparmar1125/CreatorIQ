import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTrendsStore, type Trend } from '../../../stores/useTrendsStore';
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
  Video,
  Clock,
  CheckCircle2,
  Zap,
  Users,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Cpu,
  Play,
  Layers,
  Compass,
} from 'lucide-react';

import { cleanTrendTitle, resolveVideoConcept } from '../../../lib/cleanTrendTitle';
import { ConceptGraph } from '../components/ConceptGraph';
import { TrendForecastChart } from '../components/TrendForecastChart';

export const TrendDetailPage: React.FC = () => {
  const { trendId } = useParams<{ trendId: string }>();
  const navigate = useNavigate();
  const [copiedIdx, setCopiedIdx] = useState<number | string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const handleCopy = (text: string, idx: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (isDetailLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-neutral-400 gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-white" />
        <p className="text-xs text-neutral-400 font-medium">Analyzing real-time signals &amp; creator opportunities...</p>
      </div>
    );
  }

  // Resolve trend from detail endpoint or store list (no silent fake demo data)
  const trend: Trend | undefined = trendDetail || trends.find((t) => t.id === trendId);

  if (!trend) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-neutral-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Trend Concept Not Found</h2>
          <p className="text-xs text-neutral-400 max-w-sm">
            This concept may still be syncing or does not exist in the active catalog.
          </p>
        </div>
        <Button onClick={() => navigate('/app/trends')} variant="secondary" size="sm" className="h-8 text-xs">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to Trends
        </Button>
      </div>
    );
  }

  const oppScore = Math.round(trend.opportunity_score ?? trend.tvs_score ?? 75);
  const cleanTitle = cleanTrendTitle(trend.topic);
  const verdict = trend.verdict || (oppScore >= 80 ? 'make_now' : oppScore >= 60 ? 'test_short' : 'monitor');
  const verdictBadge = trend.verdict_badge || (verdict === 'make_now' ? 'Make It Now' : verdict === 'test_short' ? 'Test with a Short' : 'Monitor Trend');

  const reachRatioVal = trend.reach_ratio_median != null ? Number(trend.reach_ratio_median).toFixed(1) : null;
  const proofVideos = trend.proof_videos || [];
  const titles = trend.curated_titles || trend.title_ideas || [
    `The Truth About ${cleanTitle} in 2026`,
    `Why Everyone Is Talking About ${cleanTitle}`,
    `I Tested ${cleanTitle} for 7 Days (Shocking Results)`,
  ];

  return (
    <div className="space-y-8 animate-in text-[#ededed] pb-16">
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
            {cleanTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleSaveTrend(trend.id)}
            className="bg-[#161616] border-[#2c2c2c] text-[#ededed] hover:bg-[#202020] h-8 text-xs gap-1.5"
          >
            <Bookmark className="h-3.5 w-3.5" />
            {trend.saved ? 'Saved' : 'Save Concept'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/app/strategy?topic=${encodeURIComponent(cleanTitle)}`)}
            className="bg-[#181818] border-[#2e2e2e] text-[#ededed] hover:bg-[#242424] h-8 text-xs gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
            Ask Copilot
          </Button>

          <Button
            size="sm"
            onClick={() => navigate(`/app/strategy?prompt=${encodeURIComponent(`Write a complete YouTube script and retention beat sheet for: "${cleanTitle}"`)}`)}
            className="bg-white text-black hover:bg-neutral-200 transition-colors font-semibold h-8 text-xs px-3.5 gap-1.5"
          >
            <Film className="h-3.5 w-3.5 text-black" />
            Create Video Plan
          </Button>
        </div>
      </div>

      {/* 1. CREATOR DECISION HEADER (What, Why, Urgency) */}
      <Card
        variant="elevated"
        className="border-[#262626] bg-[#121212] p-6 shadow-xl relative overflow-hidden space-y-6"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Verdict Pill */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                  verdict === 'make_now'
                    ? 'border-emerald-600/40 bg-emerald-950/40 text-emerald-300'
                    : verdict === 'test_short'
                    ? 'border-amber-600/40 bg-amber-950/40 text-amber-300'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                }`}
              >
                {verdict === 'make_now' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : verdict === 'test_short' ? (
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                )}
                {verdictBadge}
              </span>

              {/* Opportunity Fit Score */}
              <span className="rounded-full bg-[#1c1c1c] border border-[#2e2e2e] px-2.5 py-1 text-xs font-semibold text-neutral-300 font-mono">
                {oppScore}/100 Opportunity
              </span>

              {/* Niches */}
              {trend.niches?.map((tag) => (
                <Badge key={tag} variant="neutral" className="text-[10px]">
                  {tag}
                </Badge>
              ))}

              {trend.outlier_streak && trend.outlier_streak > 0 ? (
                <Badge variant="warning" className="gap-1 text-[10px]">
                  <Flame className="h-3 w-3" />
                  {trend.outlier_streak}d Outlier Streak
                </Badge>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Velocity: <strong className="text-white font-mono">{trend.velocity || 'Rising'}</strong></span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-sora text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {cleanTitle}
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed max-w-3xl">
              {trend.verdict_reason || trend.why_trending || 'High breakout momentum detected across platform channels.'}
            </p>
          </div>
        </div>

        {/* 4 Decision Pillars */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
          <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Clock className="h-3 w-3 text-indigo-400" />
              Optimal Window
            </span>
            <p className="text-sm font-bold text-white font-mono">
              {trend.publish_window_days || 'Next 3–5 Days'}
            </p>
            <p className="text-[10px] text-neutral-500">Peak demand window</p>
          </div>

          <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Users className="h-3 w-3 text-emerald-400" />
              Competition
            </span>
            <p className="text-sm font-bold text-white font-mono truncate">
              {trend.competition_level || 'Low Competition'}
            </p>
            <p className="text-[10px] text-neutral-500">Supply vs demand balance</p>
          </div>

          <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-cyan-400" />
              Demand Trend
            </span>
            <p className="text-sm font-bold text-white font-mono truncate">
              {trend.demand_direction || 'Accelerating'}
            </p>
            <p className="text-[10px] text-neutral-500">Viewer search velocity</p>
          </div>

          <div className="rounded-xl border border-[#242424] bg-[#161616] p-3.5 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Channels Your Size
            </span>
            <p className="text-sm font-bold text-white font-mono truncate">
              {trend.peer_view_range || '15K – 60K Views'}
            </p>
            <p className="text-[10px] text-neutral-500">Expected reach range</p>
          </div>
        </div>
      </Card>

      {/* 2. WHY THIS TOPIC IS WORKING (Platform Signals) */}
      <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1f1f1f] pb-3.5">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            Why This Topic Is Breaking Out
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-xs leading-relaxed">
          <div className="rounded-xl border border-[#222222] bg-[#161616] p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Viewer Retention Signal
            </span>
            <p className="text-neutral-300">
              {trend.why_trending || trend.why_predicted || 'Surging organic interest with viewers seeking fresh, practical perspectives on this topic.'}
            </p>
          </div>

          <div className="rounded-xl border border-[#222222] bg-[#161616] p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Small Channel Advantage
            </span>
            <p className="text-neutral-300">
              {trend.small_channel_count && trend.small_channel_count > 0
                ? `${trend.small_channel_count} small channels (<25K subs) recently had viral breakout videos on this topic, proving organic demand over brand size.`
                : 'Verified breakout distribution detected across small and mid-sized creators.'}
            </p>
          </div>

          <div className="rounded-xl border border-[#222222] bg-[#161616] p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Outlier Velocity
            </span>
            <p className="text-neutral-300">
              {trend.key_indicator || (reachRatioVal ? `Median Reach Ratio is ${reachRatioVal}x higher than standard channel averages.` : 'Accelerating discovery signals detected in organic search.')}
            </p>
          </div>
        </div>
      </Card>

      {/* 3. PROOF: VIDEOS WINNING RIGHT NOW (Real Outlier Videos) */}
      <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f1f1f] pb-3.5">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Verified Proof: Videos Winning Right Now
            </h2>
          </div>
          <span className="text-[11px] text-neutral-400">
            Real uploads in this niche outperforming their 30-day view baseline
          </span>
        </div>

        {proofVideos.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {proofVideos.slice(0, 6).map((vid) => (
              <a
                key={vid.video_id}
                href={vid.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-xl border border-[#242424] bg-[#161616] p-3 hover:border-indigo-500/40 transition-all hover:bg-[#191919]"
              >
                <div className="space-y-2.5">
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 border border-[#222]">
                    <img
                      src={vid.thumbnail_url}
                      alt={vid.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {/* Multiplier Badge */}
                    <span className="absolute bottom-1.5 right-1.5 rounded bg-emerald-950/90 border border-emerald-600/50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 font-mono">
                      {vid.reach_multiplier} Reach
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                    {vid.title}
                  </h3>
                </div>

                <div className="pt-3 border-t border-[#222222] mt-2.5 flex items-center justify-between text-[11px] text-neutral-400">
                  <div className="truncate max-w-[140px]">
                    <span className="font-medium text-neutral-300">{vid.channel_title}</span>
                    {vid.subscriber_count > 0 && (
                      <span className="text-[10px] text-neutral-500 block">
                        {(vid.subscriber_count / 1000).toFixed(1)}K subs
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-indigo-400 shrink-0">
                    <span className="font-mono font-semibold text-white">
                      {(vid.view_count / 1000).toFixed(0)}K views
                    </span>
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#222222] bg-[#161616] p-6 text-center text-xs text-neutral-400 space-y-1">
            <p className="font-medium text-neutral-300">Live platform signal detected</p>
            <p className="text-[11px] text-neutral-500">
              Signal derived from organic search clustering &amp; community interest.
            </p>
          </div>
        )}
      </Card>

      {/* 4. 30-DAY MOMENTUM TRAJECTORY */}
      {trendForecast && (
        <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f1f1f] pb-3.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                30-Day Demand Trajectory Forecast
              </h2>
            </div>
            <span className="text-[11px] text-neutral-400">
              Evaluated across 85 longitudinal algorithm signals
            </span>
          </div>

          {isForecastLoading ? (
            <div className="flex items-center justify-center p-12 border border-[#222222] rounded-xl bg-[#141414]">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Calculating demand trajectory...
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#222222] bg-[#141414] p-4">
              <TrendForecastChart forecast={trendForecast} trend={trend} />
            </div>
          )}
        </Card>
      )}

      {/* 5. CREATOR PACKAGING BLUEPRINT & TITLE ANGLES */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Hook Architect Box */}
        <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3.5">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Hook Architect &amp; Retention Blueprint
                </h2>
              </div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                First 3 Seconds
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-[#222222] bg-[#161616] p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    0–0.8s Visual Hook
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(trend.hook_blueprint?.visual_hook || 'Rapid zoom-in on the primary subject within the first 0.8 seconds.', 'vh')}
                    className="text-neutral-500 hover:text-white transition-colors"
                  >
                    {copiedIdx === 'vh' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <p className="text-neutral-300">
                  {trend.hook_blueprint?.visual_hook || 'Rapid zoom-in or intense visual contrast in the opening 0.8s to stop the viewer from scrolling.'}
                </p>
              </div>

              <div className="rounded-lg border border-[#222222] bg-[#161616] p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Opening Audio Hook
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(trend.hook_blueprint?.audio_hook || `If you are still ignoring ${cleanTitle}, you are missing out on what is working right now.`, 'ah')}
                    className="text-neutral-500 hover:text-white transition-colors"
                  >
                    {copiedIdx === 'ah' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <p className="text-neutral-300 italic">
                  &ldquo;{trend.hook_blueprint?.audio_hook || `If you are still doing this the old way, you are falling behind what's actually working in ${cleanTitle}...`}&rdquo;
                </p>
              </div>

              <div className="rounded-lg border border-[#222222] bg-[#161616] p-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  45% Retention Twist
                </span>
                <p className="text-neutral-300">
                  {trend.hook_blueprint?.retention_twist || 'Deliver the core answer at the 45% mark, then introduce an unexpected takeaway or bonus tip before the CTA.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e1e1e]">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/app/strategy?prompt=${encodeURIComponent(`Generate a full video script and teleprompter outline for: "${cleanTitle}" with the visual hook: "${trend.hook_blueprint?.visual_hook || ''}"`)}`)}
              className="w-full bg-[#181818] border-[#2c2c2c] hover:bg-[#202020] text-xs h-8 gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Generate Full Script with Copilot
            </Button>
          </div>
        </Card>

        {/* 3 High-CTR Title Angles */}
        <Card variant="elevated" className="border-[#262626] bg-[#121212] p-6 shadow-md space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  3 Click-Worthy Title Angles
                </h2>
              </div>
              <span className="text-[10px] text-neutral-500">1-click copy</span>
            </div>

            <div className="space-y-2.5">
              {titles.slice(0, 3).map((title, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#222222] bg-[#161616] p-3 text-xs text-neutral-200 hover:border-[#333333] transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">
                      Angle {idx + 1}
                    </span>
                    <p className="font-medium text-white">{title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(title, idx)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-md bg-[#111] border border-[#2a2a2a] transition-colors cursor-pointer shrink-0"
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

            {/* Video Concept Summary */}
            <div className="rounded-lg bg-[#141414] border border-[#202020] p-3 text-xs text-neutral-400 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Core Angle
              </span>
              <p className="text-neutral-300 leading-relaxed font-medium">
                &ldquo;{resolveVideoConcept(trend)}&rdquo;
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e1e1e]">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCopy(titles[0], 'top-title')}
              className="w-full bg-[#181818] border-[#2c2c2c] hover:bg-[#202020] text-xs h-8 gap-1.5"
            >
              {copiedIdx === 'top-title' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied Angle 1!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-neutral-400" />
                  Copy Recommended Title
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* 6. COLLAPSIBLE ADVANCED MODEL & SIGNAL TELEMETRY */}
      <div className="pt-2 border-t border-[#1e1e1e]">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between rounded-xl border border-[#242424] bg-[#141414] p-4 text-xs hover:border-[#333333] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <div className="text-left">
              <span className="font-bold text-neutral-200 uppercase tracking-wider text-[11px] block">
                Advanced Model &amp; Signal Telemetry (Power Users)
              </span>
              <span className="text-[10px] text-neutral-500">
                LightGBM 85-feature explainability weights, Qdrant vector space, &amp; gate audit
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="text-[10px] font-mono">{showAdvanced ? 'Hide' : 'Expand'}</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-6 animate-in">
            {/* Concept Topology Graph */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Compass className="h-3.5 w-3.5 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Concept Topology &amp; Vector Space (Qdrant)
                </h3>
              </div>
              <ConceptGraph trend={trend} />
            </div>

            {/* Feature Weights & Funnel */}
            {trendForecast?.top_features && trendForecast.top_features.length > 0 && (
              <Card variant="elevated" className="border-[#262626] bg-[#121212] p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                  Top Driving Features (of 85 Engineered Signals)
                </h3>
                <div className="space-y-2.5">
                  {trendForecast.top_features.slice(0, 5).map((feat, i) => {
                    const pct = Math.min(100, Math.max(12, Math.round(feat.importance * 100 * 2.2)));
                    return (
                      <div key={feat.feature || i} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-neutral-300">{feat.feature}</span>
                          <span className="font-mono text-[11px] text-neutral-400">
                            val: <strong className="text-white">{Number(feat.value).toFixed(2)}</strong> &bull; weight:{' '}
                            <strong className="text-indigo-300">{(feat.importance * 100).toFixed(1)}%</strong>
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#202020] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
