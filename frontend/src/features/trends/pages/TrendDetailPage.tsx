import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTrendsStore } from '../../../stores/useTrendsStore';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  Bookmark,
  Flame,
} from 'lucide-react';

import { cleanTrendTitle, resolveVideoConcept } from '../../../lib/cleanTrendTitle';
import { TrendForecastChart } from '../components/TrendForecastChart';

export const TrendDetailPage: React.FC = () => {
  const { trendId } = useParams<{ trendId: string }>();
  const navigate = useNavigate();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const {
    trendDetail,
    isDetailLoading,
    detailError,
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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (detailError || !trendDetail) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/trends')}>
          <ArrowLeft className="h-4 w-4" />
          Back to trends
        </Button>
        <Alert variant="error">{detailError ?? 'Trend not found'}</Alert>
      </div>
    );
  }

  const trend = trendDetail;

  return (
    <div className="space-y-6 animate-in">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/trends')}>
        <ArrowLeft className="h-4 w-4" />
        Back to trends
      </Button>

      <PageHeader
        title={cleanTrendTitle(trend.topic)}
        description={trend.headline && trend.headline !== trend.topic ? trend.headline : undefined}
        badge={
          <div className="mb-2 flex flex-wrap gap-2">
            {trend.niches?.map((tag) => (
              <Badge key={tag} variant="brand">
                {tag}
              </Badge>
            ))}
            <Badge variant="neutral">{trend.archetype}</Badge>
            {trend.creator_tier && (
              <Badge variant="neutral" className="capitalize">
                {trend.creator_tier} creator
              </Badge>
            )}
            {trend.is_momentum_outlier && (
              <Badge variant="warning" className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
                <Flame className="h-3 w-3" />
                Breakout Spike
              </Badge>
            )}
            {trend.ai_enriched && (
              <Badge variant="neutral">
                <Sparkles className="h-3 w-3" />
                AI curated
              </Badge>
            )}
          </div>
        }
        actions={
          <Button
            variant={trend.saved ? 'primary' : 'secondary'}
            onClick={() => toggleSaveTrend(trend.id)}
          >
            <Bookmark className="h-4 w-4" />
            {trend.saved ? 'Saved' : 'Save trend'}
          </Button>
        }
      />

      {trend.is_youtube_video && trend.channel_name && (
        <p className="text-sm text-neutral-500">
          Trending via {trend.channel_name}
          {trend.video_url && (
            <a
              href={trend.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1 text-brand-600 hover:underline"
            >
              Watch source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {isForecastLoading ? (
            <Card variant="elevated" className="flex items-center justify-center p-8">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                Generating Prophet trajectory forecast...
              </div>
            </Card>
          ) : trendForecast ? (
            <TrendForecastChart forecast={trendForecast} />
          ) : null}

          <Card variant="elevated">
            <h2 className="text-sm font-semibold text-neutral-900">Why it&apos;s trending</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {trend.why_trending || trend.description}
            </p>
            {trend.key_indicator && (
              <p className="mt-3 text-xs text-neutral-500">Key signal: {trend.key_indicator}</p>
            )}
          </Card>

          <Card variant="dark">
            <h2 className="text-sm font-semibold">Your angle</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-200">
              &ldquo;{resolveVideoConcept(trend)}&rdquo;
            </p>
            {trend.growth_tip && (
              <p className="mt-3 text-sm text-neutral-400">{trend.growth_tip}</p>
            )}
          </Card>

          {trend.title_ideas && trend.title_ideas.length > 0 && (
            <Card variant="elevated">
              <h2 className="text-sm font-semibold text-neutral-900">Title ideas</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Use these in Strategy or Planner to build your brief.
              </p>
              <div className="mt-4 space-y-2">
                {trend.title_ideas.map((title, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5"
                  >
                    <p className="text-sm text-neutral-800">{title}</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(title, idx)}
                      className="shrink-0 rounded p-1.5 text-neutral-400 hover:bg-white hover:text-brand-600"
                      aria-label="Copy title"
                    >
                      {copiedIdx === idx ? (
                        <Check className="h-4 w-4 text-success-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <Link
                to="/app/strategy"
                className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                Open Strategy →
              </Link>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card variant="elevated">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-neutral-500">Opportunity score</dt>
                <dd className="mt-1 text-2xl font-semibold text-neutral-900">
                  {Math.round(trend.opportunity_score ?? trend.tvs_score)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Velocity</dt>
                <dd className="mt-1 font-medium text-neutral-900">{trend.velocity}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Est. reach</dt>
                <dd className="mt-1 font-medium text-neutral-900">{trend.volume}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Stability</dt>
                <dd className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-success-600 to-emerald-400"
                      style={{ width: `${trend.stability_score ?? 50}%` }}
                    />
                  </div>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Saturation</dt>
                <dd className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={`h-full ${(trend.saturation_index ?? 50) > 70 ? 'bg-orange-500' : 'bg-brand-600'}`}
                      style={{ width: `${trend.saturation_index ?? 50}%` }}
                    />
                  </div>
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
};
