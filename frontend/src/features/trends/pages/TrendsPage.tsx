import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTrendsStore, type Trend, type TrendSignalPoint } from '../../../stores/useTrendsStore';
import { FeedHistoryDrawer } from '../components/FeedHistoryDrawer';
import { TrendMiniChart } from '../components/TrendMiniChart';
import logo from '../../../assets/logo.png';
import {
  cleanTrendText,
  cleanTrendTitle,
  isBoilerplateConcept,
} from '../../../lib/cleanTrendTitle';
import { formatCompactNumber } from '../../../lib/viewEstimator';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Film,
  Globe,
  History,
  LayoutList,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Content-type filters — these map to the existing supported formats
 * ------------------------------------------------------------------ */
const FORMAT_TABS = 
[
  { key: 'all' as const, label: 'All content types', Icon: Layers },
  { key: 'long_form' as const, label: 'Long-form', Icon: LayoutList },
  { key: 'shorts' as const, label: 'Shorts', Icon: Film },
  { key: 'saved' as const, label: 'Saved', Icon: Bookmark },
];

/* ------------------------------------------------------------------ *
 * Demand filters — driven by the real `lifecycle` value the API returns
 * (emerging / growing / peaking / declining / expired)
 * ------------------------------------------------------------------ */
type DemandKey = 'all' | 'growing' | 'peaking' | 'moderate' | 'declining';

const DEMAND_FILTERS: { key: DemandKey; label: string; lifecycles: string[] | null }[] = [
  { key: 'all', label: 'All demand', lifecycles: null },
  { key: 'growing', label: 'Growing demand', lifecycles: ['growing'] },
  { key: 'peaking', label: 'Interest at peak', lifecycles: ['peaking'] },
  { key: 'moderate', label: 'Moderate demand', lifecycles: ['emerging'] },
  { key: 'declining', label: 'Declining demand', lifecycles: ['declining', 'expired'] },
];

const LIFECYCLE_META: Record<string, { label: string; className: string }> = {
  emerging: {
    label: 'Early signal',
    className: 'border-[#D9CEF5] bg-[#F1ECFF] text-[#4A2E8F]',
  },
  growing: {
    label: 'Growing demand',
    className: 'border-[#B8EED8] bg-[#E8FBF4] text-[#0F5C43]',
  },
  peaking: {
    label: 'Interest at peak',
    className: 'border-[#B8EED8] bg-[#E8FBF4] text-[#0F5C43]',
  },
  declining: {
    label: 'Declining demand',
    className: 'border-[#E5E0E8] bg-[#FBFAF8] text-[#625D68]',
  },
  expired: {
    label: 'Expired signal',
    className: 'border-[#E5E0E8] bg-[#FBFAF8] text-[#77717F]',
  },
};

function formatCompactVolume(num: number): string {
  if (!Number.isFinite(num) || num <= 0) return '0';
  return formatCompactNumber(num);
}

function daysBetween(from: string, to: string): number {
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

interface GrowthReading {
  pct: number;
  days: number;
}

/** Growth measured from the real daily signal history the API returns. */
function readGrowth(history?: TrendSignalPoint[]): GrowthReading | null {
  if (!history || history.length < 2) return null;
  const first = history[0];
  const last = history[history.length - 1];
  const base = Number(first.trend_score_median);
  const current = Number(last.trend_score_median);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(current)) return null;
  return {
    pct: ((current - base) / base) * 100,
    days: daysBetween(first.video_date, last.video_date),
  };
}

export const TrendsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    trends,
    savedTrends,
    isLoading,
    isRefreshing,
    error,
    emptyReason,
    channelContext,
    geoContext,
    credits,
    feedId,
    snapshotAt,
    isPersonalized,
    aiEnriched,
    isHistorical,
    feedHistory,
    isHistoryLoading,
    activeFormatFilter,
    fetchTrends,
    refreshFeed,
    fetchFeedHistory,
    loadHistoricalFeed,
    loadCurrentFeed,
    toggleSaveTrend,
    setFormatFilter,
  } = useTrendsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [demandFilter, setDemandFilter] = useState<DemandKey>('all');
  const [pendingDetailId, setPendingDetailId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  useEffect(() => {
    if (historyOpen) {
      fetchFeedHistory();
    }
  }, [historyOpen, fetchFeedHistory]);

  const handlePredict = () => {
    const q = searchQuery.trim();
    setActiveSearch(q);
    fetchTrends(q || undefined);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    fetchTrends();
  };

  /** Content-type filter (existing behaviour, backed by supported_formats). */
  const formatFiltered = useMemo(() => {
    if (activeFormatFilter === 'saved') {
      const fromFeed = trends.filter((t) => t.saved);
      const seen = new Set(fromFeed.map((t) => t.id));
      const extras = savedTrends.filter((t) => !seen.has(t.id));
      return [...fromFeed, ...extras];
    }
    if (activeFormatFilter === 'all') return trends;
    return trends.filter((t) => t.supported_formats?.includes(activeFormatFilter));
  }, [trends, savedTrends, activeFormatFilter]);

  /** Demand filter — applied on top of the content-type filter. */
  const filteredTrends = useMemo(() => {
    const active = DEMAND_FILTERS.find((d) => d.key === demandFilter);
    if (!active || !active.lifecycles) return formatFiltered;
    return formatFiltered.filter((t) =>
      active.lifecycles?.includes(String(t.lifecycle || t.status || '').toLowerCase())
    );
  }, [formatFiltered, demandFilter]);

  const demandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DEMAND_FILTERS.forEach((d) => {
      counts[d.key] = d.lifecycles
        ? formatFiltered.filter((t) =>
            d.lifecycles?.includes(String(t.lifecycle || t.status || '').toLowerCase())
          ).length
        : formatFiltered.length;
    });
    return counts;
  }, [formatFiltered]);

  const isFiltered = activeFormatFilter !== 'all' || demandFilter !== 'all' || !!activeSearch;

  const resetFilters = () => {
    setFormatFilter('all');
    setDemandFilter('all');
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      {/* ---------------------------------------------------------- *
          Brand header
         ---------------------------------------------------------- */}
      <header className="flex items-center justify-between gap-3 border-b border-[#E5E0E8] pb-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
          title="Back to home"
        >
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5 shadow-xs">
            <img src={logo} alt="CreatorIQ" className="h-full w-full object-contain" />
          </span>
          <span className="font-sora text-sm font-bold tracking-tight text-[#171717]">CreatorIQ</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E5E0E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#625D68] transition-colors hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]"
          >
            <History className="h-3.5 w-3.5" />
            History
            {feedHistory.length > 0 && (
              <span className="rounded-full bg-[#F1ECFF] px-1.5 py-0.5 text-[10px] font-bold text-[#4A2E8F]">
                {feedHistory.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => refreshFeed()}
            disabled={isRefreshing || isLoading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E5E0E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#625D68] transition-colors hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------- *
          Page title
         ---------------------------------------------------------- */}
      <div className="mt-6 flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate('/app/dashboard')}
          aria-label="Back to overview"
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#E5E0E8] bg-white text-[#625D68] transition-colors hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="font-sora text-[22px] font-extrabold leading-tight tracking-tight text-[#171717] sm:text-[28px]">
            View all popular content ideas
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[#625D68]">
            {isPersonalized
              ? 'Ranked for your niche from the live signal feed. Every metric below comes from the collected signals.'
              : 'Browse the collected signal feed. Every metric below comes from the collected signals.'}
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------- *
          Search composer
         ---------------------------------------------------------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handlePredict();
        }}
        className="mt-5 flex items-center gap-2 rounded-2xl border border-[#E5E0E8] bg-white p-1.5 pl-4 transition-shadow focus-within:border-[#C9BCF0] focus-within:shadow-[0_0_0_3px_rgba(241,236,255,0.9)]"
      >
        <Search className="h-4 w-4 shrink-0 text-[#A79FB0]" aria-hidden="true" />
        <label htmlFor="trends-search" className="sr-only">
          Search content topics or trends
        </label>
        <input
          id="trends-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search content topics or trends..."
          className="h-9 min-w-0 flex-1 border-0 bg-transparent text-sm text-[#171717] placeholder-[#9B94A5] focus:outline-none"
        />
        {activeSearch && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label="Clear search"
            className="cursor-pointer rounded-lg p-1.5 text-[#77717F] transition-colors hover:bg-[#F6F3FF] hover:text-[#171717]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="app-btn-pink h-9 shrink-0 px-4 text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* ---------------------------------------------------------- *
          Filter chips — content type and demand are separate dimensions
         ---------------------------------------------------------- */}
      <div className="mt-5 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* <span className="app-section-label mr-1">Content type</span>
          {FORMAT_TABS.map(({ key, label, Icon }) => {
            const isActive = activeFormatFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFormatFilter(key)}
                aria-pressed={isActive}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'border-[#171717] bg-[#171717] text-white'
                    : 'border-[#E5E0E8] bg-white text-[#625D68] hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })} */}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="app-section-label mr-1">Demand</span>
          {DEMAND_FILTERS.map((d) => {
            const isActive = demandFilter === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setDemandFilter(d.key)}
                aria-pressed={isActive}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'border-[#171717] bg-[#171717] text-white'
                    : 'border-[#E5E0E8] bg-white text-[#625D68] hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]'
                }`}
              >
                {d.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F1ECFF] text-[#4A2E8F]'
                  }`}
                >
                  {demandCounts[d.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------- *
          Feed context
         ---------------------------------------------------------- */}
      {(geoContext?.badge || credits || isHistorical || snapshotAt || aiEnriched) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[#E5E0E8] bg-white px-3.5 py-2.5 text-xs text-[#625D68]">
          {isHistorical && (
            <span className="text-[#946200]">
              Viewing a past snapshot.{' '}
              <button
                type="button"
                onClick={() => loadCurrentFeed()}
                className="cursor-pointer font-semibold text-[#4A2E8F] underline hover:text-[#171717]"
              >
                Back to current
              </button>
            </span>
          )}
          {geoContext?.badge && (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-[#77717F]" />
              {geoContext.badge}
            </span>
          )}
          {aiEnriched && (
            <span className="inline-flex items-center gap-1.5 text-[#4A2E8F]">
              <Sparkles className="h-3.5 w-3.5" />
              AI enriched
            </span>
          )}
          {credits && (
            <span className="inline-flex items-center gap-1.5">
              Refresh credits: {credits.remaining ?? credits.used ?? 0} left
            </span>
          )}
          {snapshotAt && (
            <span className="ml-auto text-[11px] text-[#77717F]">
              Updated {new Date(snapshotAt).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {channelContext?.name && !activeSearch && (
        <div className="mt-3 flex items-center gap-2.5 text-xs text-[#625D68]">
          {channelContext.thumbnail_url ? (
            <img
              src={channelContext.thumbnail_url}
              alt=""
              className="h-6 w-6 shrink-0 rounded-md border border-[#E5E0E8] object-cover"
            />
          ) : null}
          <span>
            Ranked for <span className="font-semibold text-[#171717]">{channelContext.name}</span>
            {channelContext.niches?.length
              ? ` · ${channelContext.niches.slice(0, 3).join(', ')}`
              : ''}
          </span>
        </div>
      )}

      <FeedHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        feeds={feedHistory}
        isLoading={isHistoryLoading}
        activeFeedId={feedId}
        onSelect={(id) => loadHistoricalFeed(id)}
        onSelectCurrent={() => loadCurrentFeed()}
      />

      {/* ---------------------------------------------------------- *
          Errors and states
         ---------------------------------------------------------- */}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-[#F5C6CE] bg-[#FDECEF] px-4 py-3 text-xs text-[#B42332]"
        >
          Could not load trends — {error}. Your search text is kept, try again in a moment.
        </div>
      )}

      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-[#EFEBF2] bg-white p-5">
              <div className="h-5 w-28 rounded-full bg-[#F1EEF5]" />
              <div className="mt-4 h-4 w-3/4 rounded bg-[#F1EEF5]" />
              <div className="mt-4 h-10 w-full rounded-lg bg-[#F1EEF5]" />
              <div className="mt-4 h-8 w-full rounded bg-[#F1EEF5]" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredTrends.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E5E0E8] bg-white p-10 text-center">
          <TrendingUp className="mx-auto h-6 w-6 text-[#A79FB0]" />
          <h2 className="mt-2 text-sm font-bold text-[#171717]">
            {activeSearch
              ? `No results for “${activeSearch}”`
              : isFiltered
                ? 'No trends match these filters'
                : 'No opportunities yet'}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#625D68]">
            {activeSearch
              ? 'Nothing in the collected signals matches that phrase. Try a broader topic or clear the search.'
              : emptyReason ??
                (isFiltered
                  ? 'Reset the filters to see every opportunity in the feed.'
                  : 'Signals are still collecting. Refresh the feed in a moment to build your opportunity list.')}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {activeSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="app-btn-pink h-9 px-4 text-xs"
              >
                Back to feed
              </button>
            )}
            {isFiltered && !activeSearch && (
              <button
                type="button"
                onClick={resetFilters}
                className="app-btn-pink h-9 px-4 text-xs"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- *
          Trend cards
         ---------------------------------------------------------- */}
      {!isLoading && filteredTrends.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredTrends.map((trend: Trend) => {
            const score =
              trend.opportunity_score != null
                ? Math.round(trend.opportunity_score)
                : trend.tvs_score != null
                  ? Math.round(trend.tvs_score)
                  : null;
            const lifecycle = String(trend.lifecycle || trend.status || '').toLowerCase();
            const lifecycleMeta = LIFECYCLE_META[lifecycle];
            const growth = readGrowth(trend.signal_history);
            const volumeValue =
              trend.search_volume != null && trend.search_volume > 0
                ? formatCompactVolume(trend.search_volume)
                : trend.volume && trend.volume !== 'N/A'
                  ? trend.volume
                  : null;
            const interactionRate =
              trend.interaction_density_median != null && trend.interaction_density_median > 0
                ? `${(Number(trend.interaction_density_median) * 100).toFixed(1)}%`
                : null;
            const angle = !isBoilerplateConcept(trend.video_concept)
              ? cleanTrendText(trend.video_concept)
              : !isBoilerplateConcept(trend.content_angle)
                ? cleanTrendText(trend.content_angle)
                : null;

            return (
              <article
                key={trend.id}
                className="group flex flex-col rounded-2xl border border-[#E5E0E8] bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#C9BCF0] hover:shadow-[0_12px_28px_rgba(23,23,23,0.06)]"
              >
                {/* Badge row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {lifecycleMeta && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${lifecycleMeta.className}`}
                      >
                        {lifecycleMeta.label}
                      </span>
                    )}
                    {trend.niches?.slice(0, 1).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[#E5E0E8] bg-[#FBFAF8] px-2.5 py-0.5 text-[11px] font-semibold text-[#625D68]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {score != null && (
                    <span className="shrink-0 rounded-full border border-[#E5E0E8] bg-[#FBFAF8] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#171717]">
                      {score}/100 fit
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="mt-3 text-[15px] font-bold leading-snug text-[#171717]">
                  <Link to={`/app/trends/detail/${trend.id}`} className="hover:text-[#4A2E8F]">
                    {cleanTrendTitle(trend.topic)}
                  </Link>
                </h3>

                {angle && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#625D68]">
                    <span className="font-semibold text-[#171717]">Angle: </span>
                    {angle}
                  </p>
                )}

                {/* Metrics */}
                <dl className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <dt className="text-[11px] text-[#77717F]">Search volume</dt>
                    <dd className="mt-0.5 font-mono text-[15px] font-bold text-[#171717]">
                      {volumeValue ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[#77717F]">
                      {growth ? `vs ${growth.days}d ago` : 'Momentum'}
                    </dt>
                    <dd
                      className={`mt-0.5 font-mono text-[15px] font-bold ${
                        growth
                          ? growth.pct >= 0
                            ? 'text-[#167A59]'
                            : 'text-[#B42332]'
                          : 'text-[#171717]'
                      }`}
                    >
                      {growth
                        ? `${growth.pct >= 0 ? '+' : ''}${growth.pct.toFixed(1)}%`
                        : trend.velocity || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[#77717F]">Interaction rate</dt>
                    <dd className="mt-0.5 font-mono text-[15px] font-bold text-[#171717]">
                      {interactionRate ?? '—'}
                    </dd>
                  </div>
                </dl>

                {/* Compact real-data graph: momentum series, upload reach, or score */}
                <div className="mt-4">
                  <TrendMiniChart trend={trend} />
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EFEBF2] pt-3.5">
                  <button
                    type="button"
                    onClick={() => toggleSaveTrend(trend.id)}
                    aria-pressed={Boolean(trend.saved)}
                    aria-label={
                      trend.saved ? `Remove ${trend.topic} from saved` : `Save ${trend.topic}`
                    }
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      trend.saved
                        ? 'border-[#D9CEF5] bg-[#F1ECFF] text-[#4A2E8F]'
                        : 'border-[#E5E0E8] bg-white text-[#625D68] hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]'
                    }`}
                  >
                    {trend.saved ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5" />
                    )}
                    {trend.saved ? 'Saved' : 'Save'}
                  </button>

                  <Link
                    to={`/app/trends/detail/${trend.id}`}
                    onClick={() => setPendingDetailId(trend.id)}
                    aria-busy={pendingDetailId === trend.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E0E8] bg-white px-3.5 py-1.5 text-xs font-bold text-[#171717] transition-colors hover:border-[#C9BCF0] hover:bg-[#F6F3FF]"
                  >
                    {pendingDetailId === trend.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    View details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
