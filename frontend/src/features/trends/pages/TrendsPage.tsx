import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTrendsStore, type Trend } from '../../../stores/useTrendsStore';
import { FeedHistoryDrawer } from '../components/FeedHistoryDrawer';
import { TrendMiniChart } from '../components/TrendMiniChart';
import {
  cleanTrendText,
  cleanTrendTitle,
  isBoilerplateConcept,
} from '../../../lib/cleanTrendTitle';
import { formatCompactNumber } from '../../../lib/viewEstimator';
import {
  ArrowRight,
  Bookmark,
  Check,
  Film,
  History,
  LayoutList,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Content-type filters â€” these map to the existing supported formats
 * ------------------------------------------------------------------ */
const FORMAT_TABS = [
  { key: 'all' as const, label: 'All content types', Icon: Layers },
  { key: 'long_form' as const, label: 'Long-form', Icon: LayoutList },
  { key: 'shorts' as const, label: 'Shorts', Icon: Film },
  { key: 'saved' as const, label: 'Saved', Icon: Bookmark },
];

/* ------------------------------------------------------------------ *
 * Demand filters â€” driven by the real `lifecycle` value the API returns
 * (emerging / growing / peaking / declining / expired)
 * ------------------------------------------------------------------ */
type DemandKey = 'all' | 'growing' | 'peaking' | 'moderate' | 'declining';

const DEMAND_FILTERS: { key: DemandKey; label: string; lifecycles: string[] | null }[] = [
  { key: 'all', label: 'All', lifecycles: null },
  { key: 'growing', label: 'Rising', lifecycles: ['growing'] },
  { key: 'peaking', label: 'At peak', lifecycles: ['peaking'] },
  { key: 'moderate', label: 'Early', lifecycles: ['emerging'] },
  { key: 'declining', label: 'Fading', lifecycles: ['declining', 'expired'] },
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

export const TrendsPage: React.FC = () => {
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

  /** Demand filter â€” applied on top of the content-type filter. */
  const filteredTrends = useMemo(() => {
    const active = DEMAND_FILTERS.find((d) => d.key === demandFilter);
    if (!active || !active.lifecycles) return formatFiltered;
    return formatFiltered.filter((t) =>
      active.lifecycles?.includes(String(t.lifecycle || t.status || '').toLowerCase())
    );
  }, [formatFiltered, demandFilter]);

  const isFiltered = activeFormatFilter !== 'all' || demandFilter !== 'all' || !!activeSearch;

  const resetFilters = () => {
    setFormatFilter('all');
    setDemandFilter('all');
  };

  const contextParts = [
    channelContext?.name ? `Ranked for ${channelContext.name}` : null,
    channelContext?.niches?.length ? channelContext.niches.slice(0, 2).join(', ') : null,
    geoContext?.badge || null,
    aiEnriched ? 'AI-enriched angles' : null,
    credits ? `${credits.remaining ?? credits.used ?? 0} refreshes left` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto w-full max-w-5xl pb-16">
      {/* ---------------------------------------------------------- *
          Title + page utilities
         ---------------------------------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-cal-sans text-[22px] font-extrabold leading-tight tracking-tight text-[#171717] sm:text-[28px]">
            Content opportunities
          </h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#625D68]">
            {activeSearch
              ? `Results for â€œ${activeSearch}â€`
              : isPersonalized
                ? 'Ranked for your niche from the live signal feed.'
                : 'Browse the collected signal feed.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHistorical && (
            <button
              type="button"
              onClick={() => loadCurrentFeed()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#D9CEF5] bg-[#F1ECFF] px-3 py-1.5 text-xs font-semibold text-[#4A2E8F] transition-colors hover:bg-[#E7E0FF]"
            >
              Past snapshot Â· Back to current
            </button>
          )}
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
      </div>

      {/* ---------------------------------------------------------- *
          Search composer
         ---------------------------------------------------------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handlePredict();
        }}
        className="app-field mt-5 flex items-center gap-2 p-1.5 pl-4"
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
          placeholder="Search a topic you want to cover..."
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
          One filter row â€” demand chips + content-type icons
         ---------------------------------------------------------- */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {DEMAND_FILTERS.map((d) => {
          const isActive = demandFilter === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setDemandFilter(d.key)}
              aria-pressed={isActive}
              className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'border-[#171717] bg-[#171717] text-white'
                  : 'border-[#E5E0E8] bg-white text-[#625D68] hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]'
              }`}
            >
              {d.label}
            </button>
          );
        })}

        <span className="mx-1 hidden h-4 w-px bg-[#E5E0E8] sm:block" aria-hidden="true" />

        {FORMAT_TABS.map(({ key, label, Icon }) => {
          const isActive = activeFormatFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFormatFilter(key)}
              aria-pressed={isActive}
              aria-label={label}
              title={label}
              className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                isActive
                  ? 'border-[#171717] bg-[#171717] text-white'
                  : 'border-[#E5E0E8] bg-white text-[#77717F] hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------------- *
          Feed context â€” one quiet line
         ---------------------------------------------------------- */}
      {(contextParts.length > 0 || snapshotAt) && (
        <p className="mt-4 text-[11px] leading-relaxed text-[#77717F]">
          {contextParts.join(' Â· ')}
          {snapshotAt && (
            <>
              {contextParts.length > 0 ? ' Â· ' : ''}
              Updated {new Date(snapshotAt).toLocaleString()}
            </>
          )}
        </p>
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
          className="mt-5 rounded-xl border border-[#F3C9CE] bg-[#FDF1F2] px-4 py-3 text-xs text-[#8A1B26]"
        >
          Could not load trends â€” {error}. Your search text is kept, try again in a moment.
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
              ? `No results for â€œ${activeSearch}â€`
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
            const volumeValue =
              trend.search_volume != null && trend.search_volume > 0
                ? formatCompactVolume(trend.search_volume)
                : trend.volume && trend.volume !== 'N/A'
                  ? trend.volume
                  : null;
            /* Views of the topic's videos divided by their own channel's
               subscriber count â€” how far a video travels beyond its channel. */
            const reachValue =
              trend.reach_ratio_median != null && trend.reach_ratio_median > 0
                ? `${Number(trend.reach_ratio_median).toFixed(1)}x`
                : null;
            const angle = !isBoilerplateConcept(trend.video_concept)
              ? cleanTrendText(trend.video_concept)
              : !isBoilerplateConcept(trend.content_angle)
                ? cleanTrendText(trend.content_angle)
                : null;

            return (
              <article
                key={trend.id}
                className="group flex flex-col rounded-2xl border border-[#E5E0E8] bg-white p-5 transition-colors hover:border-[#C9BCF0]"
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
                    <span className="shrink-0 text-[11px] font-semibold text-[#77717F]">
                      Fit {score}/100
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="mt-3 text-[15px] font-bold leading-snug text-[#171717]">
                  <Link to={`/app/trends/detail/${trend.id}`} className="hover:text-[#4A2E8F]">
                    {cleanTrendTitle(trend.topic)}
                  </Link>
                </h3>

                {/* Why this is worth a look */}
                {angle && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#625D68]">
                    {angle}
                  </p>
                )}

                {/* Measured momentum (real data only) */}
                <div className="mt-4">
                  <TrendMiniChart trend={trend} />
                </div>

                {/* Two decision metrics */}
                <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-[#EFEBF2] pt-3.5">
                  <div className="min-w-0">
                    <dt
                      className="text-[11px] text-[#77717F]"
                      title="Median views divided by the subscriber count of the channel that published the video"
                    >
                      Reach vs channel size
                    </dt>
                    <dd className="mt-0.5 font-mono text-[15px] font-bold text-[#171717]">
                      {reachValue ?? 'â€”'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] text-[#77717F]">Search volume</dt>
                    <dd className="mt-0.5 font-mono text-[15px] font-bold text-[#171717]">
                      {volumeValue ?? 'â€”'}
                    </dd>
                  </div>
                </dl>

                {/* Footer â€” one primary action, one secondary */}
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
                    className="app-btn-pink inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs"
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
