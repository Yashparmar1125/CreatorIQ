import React, { useEffect } from 'react';
import { useDashboardStore } from '../../../stores/useDashboardStore';
import { BarChart2, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { renderStatIcon } from '../../../lib/stat-icons';
import { useAuthStore } from '../../../stores/useAuthStore';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/ui/StatCard';
import { MiniBarChart } from '../../../components/ui/MiniBarChart';
import { Link } from 'react-router';

const ACCENTS = ['brand', 'cyan', 'emerald', 'violet'] as const;
const FORECAST_DATA = [42, 58, 45, 72, 68, 85, 78];

export const DashboardPage: React.FC = () => {
  const { stats, insights, isLoading, fetchDashboard } = useDashboardStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading && stats.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl border border-neutral-200 skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <PageHeader
        title={
          <>
            Welcome back,{' '}
            <span className="text-gradient-brand">
              {user?.full_name?.split(' ')[0] || 'there'}
            </span>
          </>
        }
        description="Your channel performance overview and recommended next steps."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Calendar className="h-4 w-4" />
              Report
            </Button>
            <Link to="/app/strategy">
              <Button size="sm">Strategy</Button>
            </Link>
          </div>
        }
      />

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card variant="elevated" className="lg:col-span-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Performance forecast</h2>
              <p className="text-xs text-neutral-500">Estimated growth from recent performance</p>
            </div>
            <div className="flex gap-1 rounded-xl border border-neutral-200 bg-neutral-50/80 p-1 shadow-inner">
              {['28d', '90d', 'ALL'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    tab === '28d'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <MiniBarChart data={FORECAST_DATA} highlightIndex={5} />
          <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-100 bg-gradient-to-r from-brand-50/80 to-transparent px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-brand-700">
              <BarChart2 className="h-4 w-4" />
              <span className="font-medium">+12.4% projected</span>
              <span className="text-brand-600/70">vs last period</span>
            </div>
          </div>
        </Card>

        <Card variant="dark" className="lg:col-span-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-brand-600/10 ring-1 ring-white/10">
              <Sparkles className="h-4 w-4 text-brand-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Insights</h2>
              <p className="text-xs text-neutral-400">{insights.length} actions available</p>
            </div>
          </div>
          <div className="space-y-2">
            {insights.map((item, j) => (
              <div
                key={j}
                className="group rounded-xl border border-white/10 bg-white/5 p-3.5 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="neutral" className="border-0 bg-white/10 text-neutral-300">
                    Priority {j + 1}
                  </Badge>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-2 text-sm text-neutral-200">{item.title}</p>
                <p className="mt-1 text-xs text-neutral-500">{item.impact}</p>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-5 w-full bg-white text-neutral-900 hover:bg-neutral-100">
            View insights
          </Button>
        </Card>
      </div>
    </div>
  );
};
