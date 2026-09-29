import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTrendsStore } from '../../../stores/useTrendsStore';
import { AIScannerLoader } from '../../../components/ui/AIScannerLoader';
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
  Bookmark,
  Check,
  Copy,
} from 'lucide-react';
import {
  cleanTrendTitle,
  cleanTrendText,
  resolveVideoConcept,
  resolveVideoConceptBadge,
  cleanTrendHeadline,
} from '../../../lib/cleanTrendTitle';
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
  const [copiedConceptId, setCopiedConceptId] = useState<string | null>(null);

  const handleCopyConcept = (trendId: string, conceptText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(conceptText);
    setCopiedConceptId(trendId);
    setTimeout(() => setCopiedConceptId((prev) => (prev === trendId ? null : prev)), 2000);
  };

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

  return (
    <div className="space-y-6 animate-in text-[#ededed]">
      <PageHeader
        title="Trends Intelligence"
        description="Personalized top opportunities ranked by vector similarity, niche fit, momentum velocity, and audience geography."
        badge={
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {isPersonalized && <Badge variant="brand">Personalized</Badge>}
            {aiEnriched && (
              <Badge variant="neutral">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                AI curated
              </Badge>
            )}
          </div>
        }
        actions={
          !activeSearch ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
                <History className="h-3.5 w-3.5" />
                History
                {feedHistory.length > 0 && (
                  <span className="ml-0.5 rounded bg-[#242424] px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300">
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Refresh
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Search Input Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 rounded-lg border border-[#242424] bg-[#121212] p-1">
          <Input
            icon={<Search className="h-4 w-4 text-neutral-500" />}
            placeholder="Search a topic, concept or niche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePredict();
            }}
            className="border-transparent bg-transparent pr-24 focus:bg-transparent"
          />
          {activeSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-20 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <Button
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-xs h-7 px-3"
            onClick={handlePredict}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </div>

      {/* Meta info bar */}
      {!activeSearch && (geoContext?.badge || credits || isHistorical || snapshotAt) && (
        <Card variant="default" padding="sm" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs border-[#222222] bg-[#121212]">
          {isHistorical && (
            <span className="text-amber-400">
              Viewing past snapshot.{' '}
              <button type="button" onClick={() => loadCurrentFeed()} className="font-medium text-indigo-400 hover:underline cursor-pointer">
                Back to current
              </button>
            </span>
          )}
          {geoContext?.badge && (
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              {geoContext.badge}
            </span>
          )}
          <span className="text-[11px] text-emerald-400 font-medium">
            Live stream active
          </span>
          {snapshotAt && (
            <span className="ml-auto text-[11px] text-neutral-500">
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

      {/* Channel context + format filters */}
      {(channelContext || activeSearch) && (
        <Card variant="default" padding="sm" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-[#222222] bg-[#121212]">
          {activeSearch ? (
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-[11px] text-neutral-500">Search results for</p>
                <p className="text-xs font-semibold text-white">&ldquo;{activeSearch}&rdquo;</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearSearch} className="text-xs h-7">
                Back to feed
              </Button>
            </div>
          ) : channelContext ? (
            <div className="flex min-w-0 items-center gap-3">
              {channelContext.thumbnail_url ? (
                <img
                  src={channelContext.thumbnail_url}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-lg border border-[#2c2c2c] object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1c1c1c] text-neutral-300">
                  <User className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {channelContext.name ?? 'Your channel'}
                  {channelContext.subscriber_count > 0 && (
                    <span className="ml-2 text-neutral-400 font-normal">
                      · {formatSubs(channelContext.subscriber_count)} subs
                    </span>
                  )}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {channelContext.niches.slice(0, 4).map((niche) => (
                    <Badge key={niche} variant="neutral" className="text-[9px]">
                      {niche}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-1 rounded-lg border border-[#242424] bg-[#161616] p-1">
            {FORMAT_TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormatFilter(key)}
                className={cn(
                  'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                  activeFormatFilter === key
                    ? 'bg-[#262626] text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {error && <Alert variant="error">Could not load trends — {error}</Alert>}

      {isLoading && (
        <AIScannerLoader message={activeSearch ? `Searching vectors for "${activeSearch}"...` : undefined} />
      )}

      {!isLoading && (
        <>
          {filteredTrends.length === 0 ? (
            <Card className="py-16 text-center border-[#222222] bg-[#121212]" variant="elevated">
              <TrendingUp className="mx-auto h-7 w-7 text-neutral-600 mb-2" />
              <h3 className="text-sm font-semibold text-neutral-200">
                {activeFormatFilter !== 'all' ? 'No trends match this format filter' : 'No opportunities yet'}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-neutral-500">
                {emptyReason ??
                  (activeFormatFilter !== 'all'
                    ? 'Try switching to All or a different format.'
                    : 'Trend signals are collecting. Refresh in a moment or search a topic.')}
              </p>
              {activeFormatFilter !== 'all' && (
                <Button className="mt-4" size="sm" onClick={() => setFormatFilter('all')}>
                  Show all formats
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredTrends.map((trend: any) => (
                <Card
                  key={trend.id}
                  variant="elevated"
                  hover
                  className="group flex cursor-pointer flex-col gap-3.5 p-5 border-[#222222] hover:border-[#383838] transition-all duration-150"
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
                      {trend.niches?.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="neutral" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="brand" className="text-[10px] capitalize">{trend.archetype}</Badge>
                      {trend.vector_similarity && (
                        <Badge variant="success" className="text-[10px]">
                          {Math.round(trend.vector_similarity * 100)}% Vector Match
                        </Badge>
                      )}
                    </div>
                    {trend.opportunity_score != null && (
                      <span className="shrink-0 rounded bg-[#1f1f1f] border border-[#2c2c2c] px-2 py-0.5 text-[10px] font-bold text-white">
                        {Math.round(trend.opportunity_score ?? trend.tvs_score)} Fit
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {cleanTrendTitle(trend.topic)}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-400">
                      {cleanTrendHeadline(trend)}
                    </p>
                    {trend.is_youtube_video && trend.channel_name && (
                      <p className="mt-2 text-[11px] text-neutral-500">
                        {trend.channel_name}
                        {trend.video_url && (
                          <>
                            {' · '}
                            <a
                              href={trend.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-indigo-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Watch video <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Video Concept Highlight Box */}
                  <div className="rounded-lg border border-[#282828] bg-[#141414] p-3 transition-colors group-hover:border-[#383838]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                        Video Concept
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded bg-[#1e1e1e] px-1.5 py-0.5 text-[9px] font-medium text-neutral-400 border border-[#2c2c2c]">
                          <Film className="h-2.5 w-2.5" />
                          {resolveVideoConceptBadge(trend)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyConcept(trend.id, resolveVideoConcept(trend), e)}
                          title="Copy concept"
                          className="inline-flex items-center gap-1 rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-medium text-neutral-300 hover:bg-[#222222] border border-[#2c2c2c] transition-colors cursor-pointer"
                        >
                          {copiedConceptId === trend.id ? (
                            <>
                              <Check className="h-2.5 w-2.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-2.5 w-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-neutral-200 leading-snug">
                      &ldquo;{resolveVideoConcept(trend)}&rdquo;
                    </p>
                  </div>

                  {/* Why Predicted */}
                  {trend.why_predicted && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-neutral-300">Why Predicted: </span>
                      {cleanTrendText(trend.why_predicted)}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 border-t border-[#1e1e1e] pt-3 text-xs">
                    <div>
                      <p className="text-[11px] text-neutral-500">Velocity</p>
                      <p className="font-medium text-neutral-200">{trend.velocity}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Reach</p>
                      <p className="font-medium text-neutral-200">{trend.volume}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-neutral-500">Stability</p>
                      <p className="font-medium text-neutral-200">{Math.round(trend.stability_score ?? 50)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[#1e1e1e] pt-3">
                    {trend.key_indicator ? (
                      <span className="min-w-0 truncate text-[11px] text-neutral-500">{trend.key_indicator}</span>
                    ) : (
                      <span />
                    )}
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant={trend.saved ? 'primary' : 'secondary'}
                        size="sm"
                        className="text-xs h-7 px-2.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveTrend(trend.id);
                        }}
                      >
                        <Bookmark className="h-3 w-3" />
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
