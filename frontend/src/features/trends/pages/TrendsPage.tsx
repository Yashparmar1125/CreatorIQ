import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTrendsStore } from '../../../stores/useTrendsStore';
import { FeedHistoryDrawer } from '../components/FeedHistoryDrawer';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { Input } from '../../../components/ui/Input';
import {
  TrendingUp,
  Search,
  Sparkles,
  Loader2,
  X,
  LayoutList,
  Film,
  Layers,
  User,
  RefreshCw,
  Globe,
  ExternalLink,
  History,
  Lightbulb,
  Bookmark,
} from 'lucide-react';
import { sanitizeStrategyTopic } from '../../../lib/strategyTopic';
import { cn } from '../../../lib/utils';

const FORMAT_TABS = [
  { key: 'all' as const, label: 'All', Icon: Layers },
  { key: 'long_form' as const, label: 'Long-form', Icon: LayoutList },
  { key: 'shorts' as const, label: 'Shorts', Icon: Film },
];

function formatSubs(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const SkeletonCard = () => (
  <div className="surface-card-elevated animate-pulse space-y-4 rounded-xl p-5 md:p-6">
    <div className="h-4 w-24 rounded bg-neutral-100" />
    <div className="h-6 w-3/4 rounded bg-neutral-100" />
    <div className="h-16 w-full rounded-lg bg-neutral-50" />
    <div className="grid grid-cols-3 gap-3">
      <div className="h-10 rounded bg-neutral-50" />
      <div className="h-10 rounded bg-neutral-50" />
      <div className="h-10 rounded bg-neutral-50" />
    </div>
  </div>
);

export const TrendsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    trends,
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

  const filteredTrends = useMemo(() => {
    if (activeFormatFilter === 'all') return trends;
    return trends.filter((t) => t.supported_formats?.includes(activeFormatFilter));
  }, [trends, activeFormatFilter]);

  const extractTopic = (trend: (typeof trends)[number]) =>
    sanitizeStrategyTopic(trend.raw_topic || trend.topic);

  const handleQuickStrategy = (trend: (typeof trends)[number], e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/app/strategy', {
      state: { topic: extractTopic(trend), autoGenerate: true },
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title={<span className="text-gradient-brand">Trends</span>}
        description="Your personalized Top 5 opportunities ranked by niche fit, momentum, and audience geography."
        badge={
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {isPersonalized && <Badge variant="brand">Personalized</Badge>}
            {aiEnriched && (
              <Badge variant="neutral">
                <Sparkles className="h-3 w-3" />
                AI curated
              </Badge>
            )}
          </div>
        }
        actions={
          !activeSearch ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
                <History className="h-4 w-4" />
                History
                {feedHistory.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
                    {feedHistory.length}
                  </span>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => refreshFeed()}
                disabled={isRefreshing || isLoading}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh feed
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 rounded-xl border border-neutral-200/80 bg-white p-1 shadow-sm">
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder="Search a topic or niche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePredict();
            }}
            className="pr-24"
          />
          {activeSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-20 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={handlePredict}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </div>

      {/* Meta bar */}
      {!activeSearch && (geoContext?.badge || credits || isHistorical || snapshotAt) && (
        <Card variant="glass" padding="sm" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {isHistorical && (
            <span className="text-amber-800">
              Viewing a past snapshot.{' '}
              <button type="button" onClick={() => loadCurrentFeed()} className="font-medium text-brand-600 hover:underline">
                Back to current
              </button>
            </span>
          )}
          {geoContext?.badge && (
            <span className="flex items-center gap-1.5 text-neutral-600">
              <Globe className="h-4 w-4 shrink-0" />
              {geoContext.badge}
            </span>
          )}
          {credits && (
            <span className="text-xs text-neutral-500">
              {credits.unlimited
                ? 'Unlimited refreshes (dev)'
                : `${credits.limit} refreshes / month`}
            </span>
          )}
          {snapshotAt && (
            <span className="ml-auto text-xs text-neutral-400">
              Updated {new Date(snapshotAt).toLocaleString()}
            </span>
          )}
        </Card>
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

      {/* Channel context + filters */}
      {(channelContext || activeSearch) && (
        <Card variant="elevated" padding="sm" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {activeSearch ? (
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-xs text-neutral-500">Search results for</p>
                <p className="text-sm font-medium text-neutral-900">&ldquo;{activeSearch}&rdquo;</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                Back to my feed
              </Button>
            </div>
          ) : channelContext ? (
            <div className="flex min-w-0 items-center gap-3">
              {channelContext.thumbnail_url ? (
                <img
                  src={channelContext.thumbnail_url}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <User className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {channelContext.name ?? 'Your channel'}
                  {channelContext.subscriber_count > 0 && (
                    <span className="ml-2 text-neutral-400">
                      · {formatSubs(channelContext.subscriber_count)} subs
                    </span>
                  )}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {channelContext.niches.slice(0, 4).map((niche) => (
                    <Badge key={niche} variant="brand">
                      {niche}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50/80 p-1 shadow-inner">
            {FORMAT_TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormatFilter(key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  activeFormatFilter === key
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {error && <Alert variant="error">Could not load trends — {error}</Alert>}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {filteredTrends.length === 0 ? (
            <Card className="py-16 text-center" variant="elevated">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 ring-1 ring-brand-200/50">
                <TrendingUp className="h-6 w-6 text-neutral-400" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900">
                {activeFormatFilter !== 'all' ? 'No trends match this filter' : 'No opportunities yet'}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                {emptyReason ??
                  (activeFormatFilter !== 'all'
                    ? 'Try switching to All or a different format.'
                    : 'Trend data is still collecting. Refresh in a few minutes or search a topic.')}
              </p>
              {activeFormatFilter !== 'all' && (
                <Button className="mt-6" size="sm" onClick={() => setFormatFilter('all')}>
                  Show all formats
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredTrends.map((trend) => (
                <Card
                  key={trend.id}
                  variant="elevated"
                  hover
                  className="group flex cursor-pointer flex-col gap-4 transition-transform duration-200 hover:-translate-y-0.5"
                  onClick={() => navigate(`/app/trends/detail/${trend.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/app/trends/detail/${trend.id}`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {trend.niches.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="brand">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="neutral">{trend.archetype}</Badge>
                    </div>
                    {trend.opportunity_score != null && (
                      <span className="shrink-0 text-sm font-semibold text-neutral-900">
                        {Math.round(trend.opportunity_score ?? trend.tvs_score)}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 group-hover:text-brand-600">
                      {trend.topic}
                    </h3>
                    {trend.headline && trend.headline !== trend.topic && (
                      <p className="mt-1 text-sm text-neutral-600">{trend.headline}</p>
                    )}
                    {trend.is_youtube_video && trend.channel_name && (
                      <p className="mt-2 text-xs text-neutral-500">
                        {trend.channel_name}
                        {trend.video_url && (
                          <>
                            {' · '}
                            <a
                              href={trend.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-brand-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Watch <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  <p className="line-clamp-2 text-sm text-neutral-600">
                    {trend.content_angle || trend.growth_tip || trend.why_trending}
                  </p>

                  <div className="grid grid-cols-3 gap-3 border-t border-neutral-100 pt-4 text-sm">
                    <div>
                      <p className="text-xs text-neutral-500">Velocity</p>
                      <p className="font-medium text-neutral-900">{trend.velocity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Reach</p>
                      <p className="font-medium text-neutral-900">{trend.volume}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Stability</p>
                      <p className="font-medium text-neutral-900">{Math.round(trend.stability_score ?? 50)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-4">
                    {trend.key_indicator ? (
                      <span className="min-w-0 truncate text-xs text-neutral-500">{trend.key_indicator}</span>
                    ) : (
                      <span />
                    )}
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleQuickStrategy(trend, e)}
                        title="Generate AI strategy for this topic"
                      >
                        <Lightbulb className="h-3.5 w-3.5" />
                        Strategy
                      </Button>
                      <Button
                        variant={trend.saved ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveTrend(trend.id);
                        }}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        {trend.saved ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
