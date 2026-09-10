import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useDashboardStore } from "../../../stores/useDashboardStore";
import { useTrendsStore } from "../../../stores/useTrendsStore";
import { useAuthStore } from "../../../stores/useAuthStore";
import { renderStatIcon } from "../../../lib/stat-icons";
import { sanitizeStrategyTopic } from "../../../lib/strategyTopic";
import { cleanTrendTitle, cleanTrendText } from "../../../lib/cleanTrendTitle";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { StatCard } from "../../../components/ui/StatCard";
import { AIScannerLoader } from "../../../components/ui/AIScannerLoader";
import { MiniBarChart } from "../../../components/ui/MiniBarChart";
import {
  Sparkles,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Zap,
  BarChart2,
  ChevronRight,
} from "lucide-react";

const ACCENTS = ["brand", "cyan", "emerald", "violet"] as const;

type ForecastPeriod = '28d' | '90d' | 'ALL';

interface ForecastData {
  bars: number[];
  projectedGrowth: string;
  comparisonLabel: string;
  highlightIndex: number;
}

const FORECAST_PERIOD_DATA: Record<ForecastPeriod, ForecastData> = {
  '28d': {
    bars: [42, 56, 68, 72, 85, 94, 108],
    projectedGrowth: '+12.4%',
    comparisonLabel: 'vs last period',
    highlightIndex: 5,
  },
  '90d': {
    bars: [120, 135, 150, 142, 168, 190, 215],
    projectedGrowth: '+18.7%',
    comparisonLabel: 'vs last period',
    highlightIndex: 5,
  },
  'ALL': {
    bars: [310, 380, 420, 490, 560, 640, 750],
    projectedGrowth: '+34.2%',
    comparisonLabel: 'all-time projected',
    highlightIndex: 6,
  },
};

function formatSubs(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { stats, insights = [], fetchDashboard } = useDashboardStore();
  const [forecastPeriod, setForecastPeriod] = useState<ForecastPeriod>('28d');
  const {
    trends,
    isLoading: isTrendsLoading,
    channelContext,
    fetchTrends,
  } = useTrendsStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchDashboard();
    fetchTrends();
  }, [fetchDashboard, fetchTrends]);

  const handleQuickStrategy = (
    trend: (typeof trends)[number],
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const topic = sanitizeStrategyTopic(trend.raw_topic || trend.topic);
    navigate("/app/strategy", {
      state: { topic, autoGenerate: true },
    });
  };

  const topTrends = trends.slice(0, 4);
  const currentForecast =
    FORECAST_PERIOD_DATA[forecastPeriod] ?? FORECAST_PERIOD_DATA['28d'];

  return (
    <div className="space-y-8 animate-in">
      {/* Harmonized Light-Glass Welcome Banner */}
      <div className="surface-card-elevated relative overflow-hidden rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-50/70 via-white to-indigo-50/40 p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-400/10 blur-2xl" />
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            {channelContext?.thumbnail_url ? (
              <img
                src={channelContext.thumbnail_url}
                alt=""
                className="h-14 w-14 rounded-full border-2 border-brand-400 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-xl font-bold text-white shadow-md">
                {user?.full_name?.charAt(0) || "C"}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
                  Welcome back,{" "}
                  <span className="text-gradient-brand">
                    {user?.full_name?.split(" ")[0] || "Creator"}
                  </span>
                </h1>
                <Badge
                  variant="brand"
                  className="border-brand-200 bg-brand-100/80 text-brand-700"
                >
                  <Zap className="mr-1 h-3 w-3 text-brand-600" />
                  Qdrant Vector AI
                </Badge>
              </div>
              <p className="mt-1 text-xs text-neutral-600">
                {channelContext?.name ? (
                  <>
                    Connected:{" "}
                    <span className="font-semibold text-neutral-900">
                      {channelContext.name}
                    </span>
                    {channelContext.subscriber_count > 0 &&
                      ` (${formatSubs(channelContext.subscriber_count)} subs)`}
                  </>
                ) : (
                  "Personalized YouTube Opportunities Workspace"
                )}
              </p>
              {channelContext?.niches && channelContext.niches.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {channelContext.niches.map((niche) => (
                    <Badge key={niche} variant="brand">
                      {niche}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link to="/app/trends">
              <Button variant="secondary" size="sm">
                <TrendingUp className="h-4 w-4" />
                View All 15 Trends
              </Button>
            </Link>
            <Link to="/app/strategy">
              <Button size="sm">
                <Sparkles className="h-4 w-4" />
                AI Briefs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Channel Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard
            key={i}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            icon={renderStatIcon(stat.icon)}
            accent={ACCENTS[i % ACCENTS.length]}
          />
        ))}
      </div>

      {/* Top Predicted Trends Highlight Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Top Predicted Trends For You
            </h2>
            <p className="text-xs text-neutral-500">
              Scanned from 200+ live signals & vector-matched to your channel
              profile.
            </p>
          </div>
          <Link
            to="/app/trends"
            className="group flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Explore all 15 trends
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {isTrendsLoading && topTrends.length === 0 ? (
          <AIScannerLoader message="Vector-searching top predicted opportunities for your channel..." />
        ) : topTrends.length === 0 ? (
          <Card className="py-10 text-center" variant="elevated">
            <TrendingUp className="mx-auto h-8 w-8 text-neutral-400" />
            <h3 className="mt-2 text-sm font-semibold text-neutral-900">
              No trend predictions yet
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Run trend collector or complete your onboarding.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {topTrends.map((trend: any) => (
              <Card
                key={trend.id}
                variant="elevated"
                hover
                className="group flex cursor-pointer flex-col justify-between gap-4 transition-transform duration-200 hover:-translate-y-0.5"
                onClick={() => navigate(`/app/trends/detail/${trend.id}`)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {trend.niches?.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="brand">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="neutral">{trend.archetype}</Badge>
                      {trend.vector_similarity && (
                        <Badge
                          variant="neutral"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                          {Math.round(trend.vector_similarity * 100)}% Vector
                          Match
                        </Badge>
                      )}
                    </div>
                    {trend.opportunity_score != null && (
                      <span className="shrink-0 rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                        {Math.round(trend.opportunity_score ?? trend.tvs_score)}{" "}
                        Fit
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 group-hover:text-brand-600">
                    {cleanTrendTitle(trend.topic)}
                  </h3>

                  {trend.why_predicted && (
                    <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-2.5 text-xs text-brand-800">
                      <span className="font-semibold text-brand-900">
                        Why Predicted:{" "}
                      </span>
                      {cleanTrendText(trend.why_predicted)}
                    </div>
                  )}

                  {(trend.action_plan || trend.growth_tip) && (
                    <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-2.5 text-xs text-neutral-700">
                      <span className="font-semibold text-neutral-900">
                        Action Plan:{" "}
                      </span>
                      {cleanTrendText(trend.action_plan || trend.growth_tip)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                  <span className="text-xs font-medium text-neutral-500">
                    Velocity:{" "}
                    <span className="font-semibold text-neutral-900">
                      {trend.velocity}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    onClick={(e) => handleQuickStrategy(trend, e)}
                    className="shadow-sm"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Strategy Brief
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Performance Forecast Chart & Priority Insights (Harmonized Light Theme) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card variant="elevated" className="lg:col-span-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Performance forecast</h2>
              <p className="text-xs text-neutral-500">Estimated growth from recent performance</p>
            </div>
            <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-50/80 p-1 shadow-inner">
              {(['28d', '90d', 'ALL'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setForecastPeriod(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    forecastPeriod === tab
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <MiniBarChart data={currentForecast.bars} highlightIndex={currentForecast.highlightIndex} />
          <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-100 bg-gradient-to-r from-brand-50/80 to-transparent px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-brand-700">
              <BarChart2 className="h-4 w-4" />
              <span className="font-medium">{currentForecast.projectedGrowth} projected</span>
              <span className="text-brand-600/70">{currentForecast.comparisonLabel}</span>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="lg:col-span-4 border border-brand-100 bg-gradient-to-b from-white via-neutral-50/50 to-brand-50/30">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">AI Priority Insights</h2>
              <p className="text-xs text-neutral-500">{insights.length} actions available</p>
            </div>
          </div>
          {insights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-8 w-8 text-neutral-300" />
              <p className="mt-2 text-sm font-medium text-neutral-700">No pending insights</p>
              <p className="text-xs text-neutral-500">Your channel strategy is running smoothly.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {insights.map((item, j) => (
                <div
                  key={j}
                  className="group rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="brand" className="text-[10px]">
                      Priority {j + 1}
                    </Badge>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-neutral-900">{item.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">{item.impact}</p>
                </div>
              ))}
            </div>
          )}
          <Link to="/app/strategy">
            <Button variant="secondary" className="mt-5 w-full">
              Explore All Insights
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
