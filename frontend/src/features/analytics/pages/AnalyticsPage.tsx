import React, { useEffect } from 'react';
import { TrendingUp, Users, ArrowUpRight, ArrowDownRight, Globe, Loader2 } from 'lucide-react';
import { useAnalyticsStore } from '../../../stores/useAnalyticsStore';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MiniBarChart } from '../../../components/ui/MiniBarChart';

const RETENTION_CHART = [88, 72, 65, 58, 52, 48, 42];

export const AnalyticsPage: React.FC = () => {
  const { retentionData, trafficSources, audienceDemographics, loading, fetchAnalytics } =
    useAnalyticsStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <p className="text-sm text-neutral-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-6 animate-in">
      <PageHeader
        title={<span className="text-gradient-brand">Analytics</span>}
        description="Performance metrics and audience retention across your channel."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Export
            </Button>
            <Button size="sm">Live view</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card variant="elevated">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Retention flow</h2>
                <p className="text-xs text-neutral-500">Video performance over time</p>
              </div>
              <select className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-sm">
                <option>Latest data</option>
                <option>High velocity</option>
                <option>Baseline</option>
              </select>
            </div>
            <MiniBarChart data={RETENTION_CHART} highlightIndex={0} />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-brand-200/60 bg-gradient-to-br from-brand-50 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-brand-700">Intro hook</p>
                  <ArrowUpRight className="h-4 w-4 text-success-600" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-neutral-900 metric">{retentionData?.intro}%</p>
                <p className="mt-1 text-xs text-neutral-500">Retention at 0:30</p>
              </div>
              <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-emerald-700">Engagement</p>
                  <TrendingUp className="h-4 w-4 text-success-600" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-neutral-900 metric">{retentionData?.value}%</p>
                <p className="mt-1 text-xs text-neutral-500">Avg. view duration</p>
              </div>
              <div className="surface-dark rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-400">Outro</p>
                  <ArrowDownRight className="h-4 w-4 text-brand-400" />
                </div>
                <p className="mt-2 text-2xl font-semibold metric">{retentionData?.outro}%</p>
                <p className="mt-1 text-xs text-neutral-500">CTR point</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card variant="elevated">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <Globe className="h-4 w-4 text-brand-600" />
              Traffic sources
            </h2>
            <div className="mt-5 space-y-4">
              {trafficSources.map((source: { source: string; value: number }, i: number) => (
                <div key={i}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-neutral-700">{source.source}</span>
                    <span className="font-medium text-neutral-900">{source.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-500"
                      style={{ width: `${source.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="elevated">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <Users className="h-4 w-4 text-brand-600" />
              Audience
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {audienceDemographics.ageGroups.map(
                (group: { group: string; percentage: number }, i: number) => (
                  <div
                    key={i}
                    className="min-w-[72px] flex-1 rounded-xl border border-neutral-200 bg-gradient-to-b from-neutral-50 to-white px-3 py-2.5 shadow-sm"
                  >
                    <p className="text-xs text-neutral-500">{group.group}</p>
                    <p className="text-lg font-semibold text-neutral-900 metric">{group.percentage}%</p>
                  </div>
                )
              )}
            </div>
            <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
              <p className="text-xs font-medium text-neutral-500">Top locations</p>
              {audienceDemographics.locations.map(
                (loc: { country: string; percentage: number }, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-neutral-600">{loc.country}</span>
                    <span className="font-medium text-neutral-900">{loc.percentage}%</span>
                  </div>
                )
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
