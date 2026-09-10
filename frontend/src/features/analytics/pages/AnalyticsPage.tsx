import React, { useEffect, useState, useRef } from 'react';
import {
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Loader2,
  RefreshCw,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAnalyticsStore } from '../../../stores/useAnalyticsStore';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MiniBarChart } from '../../../components/ui/MiniBarChart';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { cn } from '../../../lib/utils';

type RetentionFilter = 'Latest data' | 'High velocity' | 'Baseline';

interface RetentionProfile {
  chart: number[];
  intro: number;
  value: number;
  outro: number;
  description: string;
  highlightIndex: number;
}

const RETENTION_PROFILES: Record<RetentionFilter, RetentionProfile> = {
  'Latest data': {
    chart: [88, 72, 65, 58, 52, 48, 42],
    intro: 88,
    value: 72,
    outro: 45,
    description: 'Video performance over time (current active upload)',
    highlightIndex: 0,
  },
  'High velocity': {
    chart: [95, 86, 79, 74, 69, 65, 60],
    intro: 95,
    value: 84,
    outro: 60,
    description: 'Top-decile viral velocity retention benchmark',
    highlightIndex: 1,
  },
  Baseline: {
    chart: [80, 64, 55, 47, 41, 36, 30],
    intro: 80,
    value: 62,
    outro: 33,
    description: 'Channel 90-day rolling baseline average',
    highlightIndex: 3,
  },
};

const escapeCsvValue = (val: string | number | undefined | null): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const AnalyticsPage: React.FC = () => {
  const {
    retentionData,
    trafficSources,
    audienceDemographics,
    loading,
    isSyncing,
    lastSynced,
    fetchAnalytics,
  } = useAnalyticsStore();
  const { addNotification } = useNotificationStore();

  const [retentionFilter, setRetentionFilter] = useState<RetentionFilter>('Latest data');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportAlert, setExportAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [liveViewToast, setLiveViewToast] = useState<string | null>(null);

  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Click outside to close export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Escape key to close export dropdown
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto-dismiss in-page export alert
  useEffect(() => {
    if (!exportAlert) return;
    const timer = setTimeout(() => {
      setExportAlert(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [exportAlert]);

  const activeProfile = RETENTION_PROFILES[retentionFilter];

  const currentMetrics = {
    intro:
      retentionFilter === 'Latest data'
        ? (retentionData?.intro ?? activeProfile.intro)
        : activeProfile.intro,
    value:
      retentionFilter === 'Latest data'
        ? (retentionData?.value ?? activeProfile.value)
        : activeProfile.value,
    outro:
      retentionFilter === 'Latest data'
        ? (retentionData?.outro ?? activeProfile.outro)
        : activeProfile.outro,
  };

  const currentChart = activeProfile.chart;
  const currentHighlight = activeProfile.highlightIndex;

  const sources = Array.isArray(trafficSources) ? trafficSources : [];
  const ageGroups = audienceDemographics?.ageGroups ?? [];
  const locations = audienceDemographics?.locations ?? [];

  const handleLiveView = async () => {
    if (isSyncing) return;
    try {
      await fetchAnalytics();
      addNotification(
        'success',
        'Live View Synced',
        'Refreshed latest channel analytics and audience metrics'
      );
      setLiveViewToast('Synced just now');
      setTimeout(() => {
        setLiveViewToast(null);
      }, 4000);
    } catch {
      addNotification('error', 'Sync Failed', 'Could not refresh live analytics');
    }
  };

  const handleExportCSV = () => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `creatori-analytics-${date}.csv`;

      const lines: string[] = [];
      lines.push('CreatorIQ Analytics Report');
      lines.push(`Generated Date,${escapeCsvValue(new Date().toISOString())}`);
      lines.push(`Retention Mode,${escapeCsvValue(retentionFilter)}`);
      lines.push('');

      lines.push('--- RETENTION METRICS ---');
      lines.push('Metric,Percentage,Notes');
      lines.push(`Intro Hook (0:30),${escapeCsvValue(currentMetrics.intro)}%,Retention at first 30 seconds`);
      lines.push(`Engagement (Avg Duration),${escapeCsvValue(currentMetrics.value)}%,Average viewer watch time`);
      lines.push(`Outro (CTR Point),${escapeCsvValue(currentMetrics.outro)}%,End-screen clickthrough threshold`);
      lines.push('');

      lines.push('--- RETENTION FLOW CURVE (W1-W7) ---');
      lines.push('Interval,Retention (%)');
      const intervals = [
        'W1 (0:00-0:30)',
        'W2 (0:30-1:00)',
        'W3 (1:00-1:30)',
        'W4 (1:30-2:00)',
        'W5 (2:00-2:30)',
        'W6 (2:30-3:00)',
        'W7 (3:00+)',
      ];
      currentChart.forEach((val, idx) => {
        lines.push(`${escapeCsvValue(intervals[idx] || `W${idx + 1}`)},${escapeCsvValue(val)}%`);
      });
      lines.push('');

      lines.push('--- TRAFFIC SOURCES ---');
      lines.push('Source,Share (%)');
      if (sources.length > 0) {
        sources.forEach((src) => {
          lines.push(`${escapeCsvValue(src.source)},${escapeCsvValue(src.value)}%`);
        });
      } else {
        lines.push('No traffic sources recorded,0%');
      }
      lines.push('');

      lines.push('--- AUDIENCE DEMOGRAPHICS (AGE GROUPS) ---');
      lines.push('Age Bracket,Share (%)');
      if (ageGroups.length > 0) {
        ageGroups.forEach((ag) => {
          lines.push(`${escapeCsvValue(ag.group)},${escapeCsvValue(ag.percentage)}%`);
        });
      } else {
        lines.push('No age group data recorded,0%');
      }
      lines.push('');

      lines.push('--- AUDIENCE DEMOGRAPHICS (TOP LOCATIONS) ---');
      lines.push('Country / Region,Share (%)');
      if (locations.length > 0) {
        locations.forEach((loc) => {
          lines.push(`${escapeCsvValue(loc.country)},${escapeCsvValue(loc.percentage)}%`);
        });
      } else {
        lines.push('No location data recorded,0%');
      }

      const csvContent = lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, filename);

      addNotification('success', 'Export Complete', `Saved analytics report as ${filename}`);
      setExportAlert({
        type: 'success',
        message: `Successfully exported CSV: ${filename}`,
      });
      setExportMenuOpen(false);
    } catch (err: unknown) {
      console.error('CSV Export failed', err);
      addNotification('error', 'Export Failed', 'Could not generate CSV file');
      setExportAlert({
        type: 'error',
        message: 'Failed to generate CSV export.',
      });
    }
  };

  const handleExportJSON = () => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `creator-analytics-${date}.json`;

      const payload = {
        reportTitle: 'CreatorIQ Analytics Report',
        exportedAt: new Date().toISOString(),
        retentionFilter,
        retention: {
          metrics: {
            introHook: currentMetrics.intro,
            engagementAvg: currentMetrics.value,
            outroCtr: currentMetrics.outro,
          },
          curve: currentChart,
          intervals: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
        },
        trafficSources: sources,
        audienceDemographics: {
          ageGroups,
          locations,
        },
        summary: {
          topTrafficSource: sources[0]?.source ?? 'N/A',
          primaryAgeGroup: ageGroups[0]?.group ?? 'N/A',
          primaryLocation: locations[0]?.country ?? 'N/A',
        },
      };

      const jsonContent = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      triggerDownload(blob, filename);

      addNotification('success', 'Export Complete', `Saved analytics report as ${filename}`);
      setExportAlert({
        type: 'success',
        message: `Successfully exported JSON: ${filename}`,
      });
      setExportMenuOpen(false);
    } catch (err: unknown) {
      console.error('JSON Export failed', err);
      addNotification('error', 'Export Failed', 'Could not generate JSON file');
      setExportAlert({
        type: 'error',
        message: 'Failed to generate JSON export.',
      });
    }
  };

  if (loading && !retentionData) {
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
        title={
          <div className="flex items-center gap-3">
            <span className="text-gradient-brand">Analytics</span>
            {lastSynced && (
              <Badge variant="success" className="hidden sm:inline-flex items-center gap-1 font-normal">
                <CheckCircle2 className="h-3 w-3" />
                <span>{liveViewToast ?? 'Live synced'}</span>
              </Badge>
            )}
          </div>
        }
        description="Performance metrics and audience retention across your channel."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative" ref={exportDropdownRef}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setExportMenuOpen((prev) => !prev)}
                aria-expanded={exportMenuOpen}
                aria-haspopup="true"
                aria-label="Export analytics report"
                className="flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-neutral-500" />
                <span>Export</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-neutral-400 transition-transform duration-200',
                    exportMenuOpen && 'rotate-180'
                  )}
                />
              </Button>
              <div
                role="menu"
                aria-label="Export options"
                className={cn(
                  'absolute right-0 mt-1.5 w-44 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg z-30 transition-all duration-150',
                  exportMenuOpen
                    ? 'opacity-100 scale-100 pointer-events-auto'
                    : 'opacity-0 scale-95 pointer-events-none'
                )}
              >
                <button
                  role="menuitem"
                  type="button"
                  onClick={handleExportCSV}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  role="menuitem"
                  type="button"
                  onClick={handleExportJSON}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                >
                  <FileCode className="h-4 w-4 text-brand-600" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleLiveView}
              disabled={isSyncing}
              aria-label="Refresh live analytics view"
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
              <span>{isSyncing ? 'Syncing...' : 'Live view'}</span>
            </Button>
          </div>
        }
      />

      {exportAlert && (
        <Alert
          variant={exportAlert.type}
          className="flex items-center justify-between shadow-sm animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{exportAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportAlert(null)}
            className="p-1 text-neutral-500 hover:text-neutral-700 rounded transition-colors"
            aria-label="Dismiss export alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card variant="elevated">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Retention flow</h2>
                <p className="text-xs text-neutral-500">{activeProfile.description}</p>
              </div>
              <select
                value={retentionFilter}
                onChange={(e) => setRetentionFilter(e.target.value as RetentionFilter)}
                aria-label="Filter retention curve"
                className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="Latest data">Latest data</option>
                <option value="High velocity">High velocity</option>
                <option value="Baseline">Baseline</option>
              </select>
            </div>
            <MiniBarChart data={currentChart} highlightIndex={currentHighlight} />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-brand-200/60 bg-gradient-to-br from-brand-50 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-brand-700">Intro hook</p>
                  <ArrowUpRight className="h-4 w-4 text-success-600" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-neutral-900 metric">
                  {currentMetrics.intro}%
                </p>
                <p className="mt-1 text-xs text-neutral-500">Retention at 0:30</p>
              </div>
              <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-emerald-700">Engagement</p>
                  <TrendingUp className="h-4 w-4 text-success-600" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-neutral-900 metric">
                  {currentMetrics.value}%
                </p>
                <p className="mt-1 text-xs text-neutral-500">Avg. view duration</p>
              </div>
              <div className="surface-dark rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-400">Outro</p>
                  <ArrowDownRight className="h-4 w-4 text-brand-400" />
                </div>
                <p className="mt-2 text-2xl font-semibold metric">{currentMetrics.outro}%</p>
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
              {sources.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No traffic sources recorded yet.
                </div>
              ) : (
                sources.map((source, i) => (
                  <div key={source.source || i}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-neutral-700">{source.source}</span>
                      <span className="font-medium text-neutral-900">{source.value ?? 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, source.value ?? 0))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card variant="elevated">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <Users className="h-4 w-4 text-brand-600" />
              Audience
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {ageGroups.length === 0 ? (
                <p className="py-2 text-xs text-neutral-400">
                  No age demographic data available.
                </p>
              ) : (
                ageGroups.map((group, i) => (
                  <div
                    key={group.group || i}
                    className="min-w-[72px] flex-1 rounded-xl border border-neutral-200 bg-gradient-to-b from-neutral-50 to-white px-3 py-2.5 shadow-sm"
                  >
                    <p className="text-xs text-neutral-500">{group.group}</p>
                    <p className="text-lg font-semibold text-neutral-900 metric">
                      {group.percentage ?? 0}%
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
              <p className="text-xs font-medium text-neutral-500">Top locations</p>
              {locations.length === 0 ? (
                <p className="py-2 text-xs text-neutral-400">
                  No location data available.
                </p>
              ) : (
                locations.map((loc, i) => (
                  <div key={loc.country || i} className="flex justify-between text-sm">
                    <span className="text-neutral-600">{loc.country}</span>
                    <span className="font-medium text-neutral-900">
                      {loc.percentage ?? 0}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
