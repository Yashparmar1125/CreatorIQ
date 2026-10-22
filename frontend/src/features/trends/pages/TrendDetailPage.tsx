import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { useTrendsStore, type Trend } from '../../../stores/useTrendsStore';
import {
  cleanTrendText,
  cleanTrendTitle,
  isBoilerplateConcept,
} from '../../../lib/cleanTrendTitle';
import { formatCompactNumber } from '../../../lib/viewEstimator';
import { TrendForecastChart } from '../components/TrendForecastChart';
import { TrendSparkline } from '../components/TrendSparkline';
import { ConceptGraph } from '../components/ConceptGraph';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Cpu,
  ExternalLink,
  Film,
  Flame,
  Loader2,
  MessageSquare,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Shared light primitives local to this page
 * ------------------------------------------------------------------ */

const Panel: React.FC<{
  title?: string;
  icon?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, icon, description, actions, className = '', children }) => (
  <section className={`rounded-2xl border border-[#E5E0E8] bg-white ${className}`}>
    {(title || actions) && (
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EFEBF2] px-5 py-3.5">
        <div className="min-w-0">
          {title && (
            <h2 className="flex items-center gap-2 text-[13px] font-bold text-[#171717]">
              {icon}
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-[11px] leading-relaxed text-[#77717F]">{description}</p>
          )}
        </div>
        {actions}
      </div>
    )}
    <div className="p-5">{children}</div>
  </section>
);

const MetricTile: React.FC<{
  label: string;
  value: string;
  note?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'positive' | 'warning';
}> = ({ label, value, note, icon, tone = 'default' }) => (
  <div className="rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-3.5">
    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#77717F]">
      {icon}
      {label}
    </span>
    <p
      className={`mt-1.5 font-mono text-sm font-bold ${
        tone === 'positive'
          ? 'text-[#167A59]'
          : tone === 'warning'
            ? 'text-[#946200]'
            : 'text-[#171717]'
      }`}
    >
      {value}
    </p>
    {note && <p className="mt-1 text-[10px] leading-snug text-[#77717F]">{note}</p>}
  </div>
);

const EmptyLine: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-lg border border-dashed border-[#E5E0E8] bg-[#FBFAF8] px-3 py-2 text-[11px] leading-relaxed text-[#77717F]">
    {children}
  </p>
);

function verdictTone(badge?: string): 'positive' | 'warning' | 'neutral' {
  if (!badge) return 'neutral';
  const lower = badge.toLowerCase();
  if (lower.includes('make it now')) return 'positive';
  if (lower.includes('test')) return 'warning';
  return 'neutral';
}

function formatNumber(value?: number): string {
  if (value == null || !Number.isFinite(Number(value)) || Number(value) <= 0) return '0';
  return formatCompactNumber(Number(value));
}

/* ------------------------------------------------------------------ *
 * Loading state — mirrors the page layout in the light theme
 * ------------------------------------------------------------------ */

const DetailSkeleton: React.FC = () => (
  <div
    className="mx-auto w-full max-w-5xl animate-pulse pb-16"
    aria-busy="true"
    aria-live="polite"
  >
    <span className="sr-only">Loading trend signals and creator opportunities…</span>

    <div className="flex items-center justify-between border-b border-[#E5E0E8] pb-3.5">
      <div className="h-4 w-40 rounded bg-[#F1EEF5]" />
      <div className="flex gap-2">
        <div className="h-8 w-24 rounded-full bg-[#F1EEF5]" />
        <div className="h-8 w-28 rounded-full bg-[#F1EEF5]" />
        <div className="h-8 w-32 rounded-full bg-[#F1EEF5]" />
      </div>
    </div>

    <div className="mt-5 rounded-2xl border border-[#EFEBF2] bg-white p-6">
      <div className="flex gap-2">
        <div className="h-6 w-32 rounded-full bg-[#F1EEF5]" />
        <div className="h-6 w-24 rounded-full bg-[#F1EEF5]" />
        <div className="h-6 w-20 rounded-full bg-[#F1EEF5]" />
      </div>
      <div className="mt-4 h-7 w-3/4 rounded bg-[#F1EEF5]" />
      <div className="mt-3 h-3.5 w-full rounded bg-[#F6F3FA]" />
      <div className="mt-2 h-3.5 w-2/3 rounded bg-[#F6F3FA]" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[86px] rounded-xl bg-[#F6F3FA]" />
        ))}
      </div>
    </div>

    <div className="mt-5 flex items-center gap-2 text-xs font-medium text-[#77717F]">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7C5CD6]" />
      Loading measured signals…
    </div>

    <div className="mt-4 rounded-2xl border border-[#EFEBF2] bg-white p-5">
      <div className="h-4 w-44 rounded bg-[#F1EEF5]" />
      <div className="mt-4 h-[220px] rounded-xl bg-[#F6F3FA]" />
    </div>

    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-[#EFEBF2] bg-white p-5">
          <div className="h-4 w-36 rounded bg-[#F1EEF5]" />
          <div className="mt-4 space-y-2.5">
            <div className="h-10 rounded-lg bg-[#F6F3FA]" />
            <div className="h-10 rounded-lg bg-[#F6F3FA]" />
            <div className="h-10 rounded-lg bg-[#F6F3FA]" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ *
 * Proof video card — real uploads only
 * ------------------------------------------------------------------ */

const ProofVideoCard: React.FC<{
  vid: NonNullable<Trend['proof_videos']>[number];
}> = ({ vid }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showFallback = imgFailed || !vid.thumbnail_url;

  return (
    <a
      href={vid.video_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-[#E5E0E8] bg-white transition-colors hover:border-[#C9BCF0]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#F6F3FF]">
        {!showFallback ? (
          <img
            src={vid.thumbnail_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#A79FB0]">
            <Video className="h-6 w-6" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/0">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600/90 shadow-sm">
            <Play className="ml-0.5 h-3.5 w-3.5 fill-white text-white" />
          </span>
        </div>
        <span className="absolute bottom-1.5 right-1.5 rounded-md border border-[#B8EED8] bg-[#E8FBF4] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0F5C43]">
          {vid.reach_multiplier} reach
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2.5 p-3">
        <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-[#171717] group-hover:text-[#4A2E8F]">
          {vid.title || 'Untitled upload'}
        </h3>
        <div className="flex items-center justify-between gap-2 border-t border-[#EFEBF2] pt-2 text-[11px]">
          <span className="min-w-0 truncate text-[#625D68]">{vid.channel_title}</span>
          <span className="inline-flex shrink-0 items-center gap-1 font-mono font-semibold text-[#171717]">
            {formatNumber(vid.view_count)} views
            <ExternalLink className="h-3 w-3 text-[#A79FB0]" />
          </span>
        </div>
      </div>
    </a>
  );
};

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export const TrendDetailPage: React.FC = () => {
  const { trendId } = useParams<{ trendId: string }>();
  const navigate = useNavigate();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    trendDetail,
    isDetailLoading,
    detailError,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendId]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      /* clipboard unavailable — the text stays selectable on screen */
    }
  };

  if (isDetailLoading) return <DetailSkeleton />;

  const trend: Trend | undefined = trendDetail || trends.find((t) => t.id === trendId);

  if (!trend) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center rounded-2xl border border-[#E5E0E8] bg-white px-6 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F5C6CE] bg-[#FDECEF] text-[#B42332]">
          <AlertCircle className="h-5 w-5" />
        </span>
        <h1 className="mt-3 text-base font-bold text-[#171717]">Trend not available</h1>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[#625D68]">
          {detailError
            ? `${detailError}. The concept may still be syncing.`
            : 'This concept does not exist in the active catalogue, or it was removed when the feed refreshed.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/app/trends')}
          className="app-btn-pink mt-4 h-9 rounded-full px-4 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to trends
        </button>
      </div>
    );
  }

  const cleanTitle = cleanTrendTitle(trend.topic);

  /* Real values only — nothing here is synthesised on the client. */
  const oppScore =
    trend.opportunity_score != null
      ? Math.round(trend.opportunity_score)
      : trend.tvs_score != null
        ? Math.round(trend.tvs_score)
        : null;

  const lifecycle = String(trend.lifecycle || trend.status || '').toLowerCase();
  const lifecycleLabel =
    lifecycle === 'growing'
      ? 'Growing demand'
      : lifecycle === 'peaking'
        ? 'Interest at peak'
        : lifecycle === 'emerging'
          ? 'Early signal'
          : lifecycle === 'declining'
            ? 'Declining demand'
            : lifecycle === 'expired'
              ? 'Expired signal'
              : null;

  const verdictBadge = trend.verdict_badge;
  const tone = verdictTone(verdictBadge);

  const proofVideos = (trend.proof_videos || []).filter(
    (v) => Number(v.reach_ratio || 0) >= 1.1 && Boolean(v.video_url)
  );

  const aiTitles = (trend.title_ideas || []).filter(Boolean);
  const templateTitles = (trend.curated_titles || []).filter(Boolean);
  const titles = aiTitles.length > 0 ? aiTitles : templateTitles;
  const titlesAreAi = aiTitles.length > 0;

  const hook = trend.hook_blueprint;
  const coreAngle =
    trend.video_concept && !isBoilerplateConcept(trend.video_concept)
      ? cleanTrendText(trend.video_concept)
      : trend.content_angle && !isBoilerplateConcept(trend.content_angle)
        ? cleanTrendText(trend.content_angle)
        : null;

  const history = trend.signal_history ?? [];
  const series =
    trend.timeseries_recent && trend.timeseries_recent.length > 1
      ? trend.timeseries_recent
      : history.map((p) => Number(p.trend_score_median));

  const interactionRate =
    trend.interaction_density_median != null && trend.interaction_density_median > 0
      ? `${(Number(trend.interaction_density_median) * 100).toFixed(1)}%`
      : null;

  const reachRatio =
    trend.reach_ratio_median != null && trend.reach_ratio_median > 0
      ? `${Number(trend.reach_ratio_median).toFixed(2)}x`
      : null;

  const searchVolume =
    trend.search_volume != null && trend.search_volume > 0
      ? formatCompactNumber(trend.search_volume)
      : trend.volume && trend.volume !== 'N/A'
        ? trend.volume
        : null;

  const askCopilot = () =>
    navigate('/app/strategy', { state: { topic: cleanTitle } });

  const createPlan = () =>
    navigate('/app/strategy', {
      state: {
        prompt: `Write a complete YouTube script and retention beat sheet for: "${cleanTitle}"`,
      },
    });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-16">
      {/* Breadcrumb + primary actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0E8] pb-3.5">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => navigate('/app/trends')}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1 font-semibold text-[#625D68] transition-colors hover:bg-[#F6F3FF] hover:text-[#171717]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Trends
          </button>
          <span className="text-[#C9C2CE]">/</span>
          <span className="truncate font-medium text-[#171717]">{cleanTitle}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSaveTrend(trend.id)}
            aria-pressed={Boolean(trend.saved)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              trend.saved
                ? 'border-[#D9CEF5] bg-[#F1ECFF] text-[#4A2E8F]'
                : 'border-[#E5E0E8] bg-white text-[#625D68] hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]'
            }`}
          >
            {trend.saved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
            {trend.saved ? 'Saved' : 'Save'}
          </button>

          <button
            type="button"
            onClick={askCopilot}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E5E0E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#625D68] transition-colors hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask Copilot
          </button>

          <button type="button" onClick={createPlan} className="app-btn-pink h-8 rounded-full px-3.5 text-xs">
            <Film className="h-3.5 w-3.5" />
            Create video plan
          </button>
        </div>
      </div>

      {/* Decision header */}
      <section className="rounded-2xl border border-[#E5E0E8] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {verdictBadge && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                tone === 'positive'
                  ? 'border-[#B8EED8] bg-[#E8FBF4] text-[#0F5C43]'
                  : tone === 'warning'
                    ? 'border-[#F0DFAF] bg-[#FFF8E6] text-[#7A5200]'
                    : 'border-[#E5E0E8] bg-[#FBFAF8] text-[#625D68]'
              }`}
            >
              {tone === 'positive' ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : tone === 'warning' ? (
                <Zap className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              {verdictBadge}
            </span>
          )}

          {lifecycleLabel && (
            <span className="rounded-full border border-[#D9CEF5] bg-[#F1ECFF] px-2.5 py-0.5 text-[11px] font-bold text-[#4A2E8F]">
              {lifecycleLabel}
            </span>
          )}

          {oppScore != null && (
            <span className="rounded-full border border-[#E5E0E8] bg-[#FBFAF8] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#171717]">
              {oppScore}/100 fit
            </span>
          )}

          {trend.outlier_streak != null && trend.outlier_streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#F0DFAF] bg-[#FFF8E6] px-2.5 py-0.5 text-[11px] font-bold text-[#7A5200]">
              <Flame className="h-3 w-3" />
              {trend.outlier_streak}-day outlier streak
            </span>
          )}

          {(trend.niches || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#E5E0E8] bg-[#FBFAF8] px-2.5 py-0.5 text-[11px] font-semibold text-[#625D68]"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mt-3 font-sora text-[24px] font-extrabold leading-tight tracking-tight text-[#171717] sm:text-[30px]">
          {cleanTitle}
        </h1>

        {(trend.verdict_reason || trend.why_trending) && (
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[#625D68]">
            {trend.verdict_reason || trend.why_trending}
          </p>
        )}

        {/* Real measured signals */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {searchVolume && (
            <MetricTile
              label="Search volume"
              value={searchVolume}
              note="Tracked searches at last collection"
              icon={<BarChart3 className="h-3 w-3 text-[#7C5CD6]" />}
            />
          )}
          {trend.velocity && (
            <MetricTile
              label="Momentum"
              value={trend.velocity}
              note="Reported by the signal collector"
              icon={<Activity className="h-3 w-3 text-[#167A59]" />}
            />
          )}
          {reachRatio && (
            <MetricTile
              label="Reach ratio"
              value={reachRatio}
              note="Median views ÷ subscribers"
              icon={<Users className="h-3 w-3 text-[#7C5CD6]" />}
            />
          )}
          {interactionRate && (
            <MetricTile
              label="Interaction rate"
              value={interactionRate}
              note="(likes + comments) ÷ views"
              icon={<TrendingUp className="h-3 w-3 text-[#7C5CD6]" />}
            />
          )}
          {series.length > 1 && (
            <div className="col-span-2 rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-3.5 sm:col-span-4 lg:col-span-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#77717F]">
                <Activity className="h-3 w-3 text-[#7C5CD6]" />
                Measured momentum ({series.length} days)
              </span>
              <TrendSparkline
                values={series}
                startLabel={history[0]?.video_date}
                endLabel={history[history.length - 1]?.video_date}
                label="Daily trend score for this concept"
                className="mt-1"
              />
            </div>
          )}
        </div>
      </section>

      {/* Engine assessment */}
      <Panel
        title="Opportunity assessment"
        icon={<Target className="h-4 w-4 text-[#7C5CD6]" />}
        description="Derived by the trend engine from collected channel and lifecycle signals."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trend.publish_window_days && (
            <MetricTile
              label="Suggested window"
              value={trend.publish_window_days}
              note="Derived from momentum and lifecycle"
              icon={<Clock className="h-3 w-3 text-[#7C5CD6]" />}
            />
          )}
          {trend.competition_level && (
            <MetricTile
              label="Competition"
              value={trend.competition_level}
              note="From channel-tier distribution & saturation"
              icon={<Users className="h-3 w-3 text-[#7C5CD6]" />}
            />
          )}
          {trend.demand_direction && (
            <MetricTile
              label="Demand direction"
              value={trend.demand_direction}
              note="From outlier streak & velocity delta"
              icon={<TrendingUp className="h-3 w-3 text-[#167A59]" />}
            />
          )}
          {trend.peer_view_range && (
            <MetricTile
              label="Peer tier baseline"
              value={trend.peer_view_range}
              note="Typical range for channels your size"
              icon={<BarChart3 className="h-3 w-3 text-[#7C5CD6]" />}
            />
          )}
          {trend.population_size != null && trend.population_size > 0 && (
            <MetricTile
              label="Tracked uploads"
              value={String(trend.population_size)}
              note="Videos in the measured population"
              icon={<Video className="h-3 w-3 text-[#7C5CD6]" />}
            />
          )}
          {trend.small_channel_count != null && trend.small_channel_count > 0 && (
            <MetricTile
              label="Small creators"
              value={String(trend.small_channel_count)}
              note="Under 25K subs in this population"
              icon={<Users className="h-3 w-3 text-[#7C5CD6]" />}
            />
          )}
          {trend.stability_score != null && trend.stability_score > 0 && (
            <MetricTile
              label="Stability"
              value={`${Math.round(Number(trend.stability_score))}/100`}
              note="Consistency of the measured demand"
              icon={<Activity className="h-3 w-3 text-[#7C5CD6]" />}
            />
          )}
          {trend.saturation_index != null && trend.saturation_index > 0 && (
            <MetricTile
              label="Saturation"
              value={`${Math.round(Number(trend.saturation_index))}/100`}
              note="How crowded the topic already is"
              icon={<BarChart3 className="h-3 w-3 text-[#7C5CD6]" />}
            />
          )}
        </div>
      </Panel>

      {/* Historical momentum + forecast */}
      <Panel
        title="Momentum and forecast"
        icon={<Activity className="h-4 w-4 text-[#7C5CD6]" />}
        description="Observed daily signals are kept separate from the model projection."
      >
        {isForecastLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-10 text-xs text-[#77717F]">
            <Loader2 className="h-4 w-4 animate-spin text-[#7C5CD6]" />
            Loading the demand trajectory…
          </div>
        ) : trendForecast ? (
          <TrendForecastChart forecast={trendForecast} trend={trend} />
        ) : (
          <EmptyLine>
            No forecast is available for this trend yet. The measured signals above stay visible,
            but the model has not produced a trajectory for it.
          </EmptyLine>
        )}
      </Panel>

      {/* Why it matters */}
      {(trend.why_trending || trend.key_indicator || trend.why_predicted) && (
        <Panel
          title="Why this trend matters"
          icon={<Sparkles className="h-4 w-4 text-[#7C5CD6]" />}
          description="Explanations returned by the trend engine for this concept."
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {trend.why_trending && (
              <div className="rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A2E8F]">
                  Audience signal
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-[#625D68]">{trend.why_trending}</p>
              </div>
            )}
            {trend.key_indicator && (
              <div className="rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#167A59]">
                  Key indicator
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-[#625D68]">{trend.key_indicator}</p>
              </div>
            )}
            {trend.why_predicted && (
              <div className="rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5200]">
                  Model note
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-[#625D68]">{trend.why_predicted}</p>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Proof videos */}
      <Panel
        title="Proof: uploads outperforming right now"
        icon={<Video className="h-4 w-4 text-[#7C5CD6]" />}
        description="Real YouTube uploads with reach above their own subscriber baseline."
      >
        {proofVideos.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {proofVideos.slice(0, 6).map((vid, idx) => (
              <ProofVideoCard key={vid.video_id || idx} vid={vid} />
            ))}
          </div>
        ) : (
          <EmptyLine>
            No verified proof uploads are attached to this concept yet. Proof appears once the
            collector finds real videos above the 1.1x reach baseline.
          </EmptyLine>
        )}
      </Panel>

      {/* Packaging */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Panel
          title="Title angles"
          icon={<Sparkles className="h-4 w-4 text-[#7C5CD6]" />}
          description={
            titlesAreAi
              ? 'Generated by the AI enrichment step for this concept.'
              : 'Template-based starting points — refine them for your voice.'
          }
        >
          {titles.length > 0 ? (
            <ul className="space-y-2.5">
              {titles.slice(0, 3).map((title, idx) => (
                <li
                  key={`${title}-${idx}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-3"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#77717F]">
                      Angle {idx + 1}
                    </span>
                    <p className="mt-0.5 text-xs font-medium leading-snug text-[#171717]">{title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(title, `title-${idx}`)}
                    title="Copy title"
                    aria-label={`Copy title ${idx + 1}`}
                    className="shrink-0 cursor-pointer rounded-md border border-[#E5E0E8] bg-white p-1.5 text-[#625D68] transition-colors hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]"
                  >
                    {copiedKey === `title-${idx}` ? (
                      <Check className="h-3.5 w-3.5 text-[#167A59]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLine>No title angles were generated for this concept yet.</EmptyLine>
          )}

          {coreAngle && (
            <div className="mt-3 rounded-xl border border-[#D9CEF5] bg-[#F1ECFF] p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A2E8F]">
                Core angle
              </span>
              <p className="mt-1 text-xs font-medium leading-relaxed text-[#2B2440]">{coreAngle}</p>
            </div>
          )}
        </Panel>

        <Panel
          title="Hook blueprint"
          icon={<Film className="h-4 w-4 text-[#7C5CD6]" />}
          description="Templated structure to adapt — not a prediction of performance."
        >
          {hook ? (
            <div className="space-y-2.5">
              {hook.visual_hook && (
                <div className="rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A2E8F]">
                      Visual hook
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(hook.visual_hook, 'visual')}
                      aria-label="Copy visual hook"
                      className="cursor-pointer rounded-md p-1 text-[#77717F] transition-colors hover:bg-white hover:text-[#171717]"
                    >
                      {copiedKey === 'visual' ? (
                        <Check className="h-3 w-3 text-[#167A59]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#625D68]">{hook.visual_hook}</p>
                </div>
              )}

              {hook.audio_hook && (
                <div className="rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#167A59]">
                      Audio hook
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(hook.audio_hook, 'audio')}
                      aria-label="Copy audio hook"
                      className="cursor-pointer rounded-md p-1 text-[#77717F] transition-colors hover:bg-white hover:text-[#171717]"
                    >
                      {copiedKey === 'audio' ? (
                        <Check className="h-3 w-3 text-[#167A59]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs italic leading-relaxed text-[#625D68]">
                    &ldquo;{hook.audio_hook}&rdquo;
                  </p>
                </div>
              )}

              {hook.retention_twist && (
                <div className="rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5200]">
                    Retention twist
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-[#625D68]">
                    {hook.retention_twist}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyLine>No hook blueprint was generated for this concept yet.</EmptyLine>
          )}

          <button
            type="button"
            onClick={createPlan}
            className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#E5E0E8] bg-white px-3 py-2 text-xs font-bold text-[#171717] transition-colors hover:border-[#C9BCF0] hover:bg-[#F6F3FF]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#7C5CD6]" />
            Generate a full script with Copilot
          </button>
        </Panel>
      </div>

      {/* Advanced telemetry */}
      <div className="border-t border-[#E5E0E8] pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E5E0E8] bg-white p-4 text-left transition-colors hover:border-[#C9BCF0]"
        >
          <div className="flex items-center gap-2.5">
            <Cpu className="h-4 w-4 shrink-0 text-[#7C5CD6]" />
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#171717]">
                Advanced signals
              </span>
              <span className="text-[10px] text-[#77717F]">
                Concept topology and the model features behind this score
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[#77717F]">
            <span className="text-[10px] font-mono">{showAdvanced ? 'Hide' : 'Show'}</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <ConceptGraph trend={trend} />

            {trendForecast?.top_features && trendForecast.top_features.length > 0 && (
              <Panel
                title="Top driving features"
                icon={<Cpu className="h-4 w-4 text-[#7C5CD6]" />}
                description={`Only the strongest of ${trendForecast.model_specs?.feature_count ?? 85} engineered signals are listed.`}
              >
                <div className="space-y-2.5">
                  {trendForecast.top_features.slice(0, 6).map((feat, i) => {
                    const pct = Math.min(100, Math.max(4, Math.round(feat.importance * 100)));
                    return (
                      <div key={`${feat.feature}-${i}`} className="text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[#625D68]">{feat.feature}</span>
                          <span className="shrink-0 font-mono text-[11px] text-[#77717F]">
                            value <strong className="text-[#171717]">{Number(feat.value).toFixed(2)}</strong>
                            {' · '}
                            <strong className="text-[#4A2E8F]">{(feat.importance * 100).toFixed(1)}%</strong>
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F1EEF5]">
                          <div
                            className="h-full rounded-full bg-[#7C5CD6]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}
          </div>
        )}
      </div>

      {/* Quiet footer action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9CEF5] bg-[#F6F3FF] p-4">
        <div>
          <p className="text-xs font-bold text-[#171717]">Ready to turn this into content?</p>
          <p className="mt-0.5 text-[11px] text-[#625D68]">
            Copilot can turn this trend into a full brief, script outline, and publishing plan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={askCopilot}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#C9BCF0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#171717] transition-colors hover:bg-[#F1ECFF]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask Copilot
          </button>
          <button type="button" onClick={createPlan} className="app-btn-pink h-8 rounded-full px-3.5 text-xs">
            <Film className="h-3.5 w-3.5" />
            Create video plan
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] text-[#A79FB0]">
        <Link to="/app/trends" className="underline hover:text-[#625D68]">
          Back to all trends
        </Link>
      </p>
    </div>
  );
};
