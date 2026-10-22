import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from '../components/brand/BrandLogo';
import { api } from '../lib/api';

interface EvaluationRecord {
  id: string;
  timestamp: string;
  model_name: string;
  entity_type: string;
  entity_id?: string | null;
  topic?: string | null;
  mae?: number | null;
  rmse?: number | null;
  mape?: number | null;
  r2_score?: number | null;
  ci_coverage_pct?: number | null;
  fit_quality?: string;
  latency_ms: number;
  observations_count: number;
  data_source: string;
  status: string;
  metrics_payload?: Record<string, unknown> | null;
}

interface EvaluationSummary {
  total_evaluations: number;
  avg_mae: number;
  avg_rmse: number;
  avg_r2_score: number;
  avg_ci_coverage_pct: number;
  avg_latency_ms: number;
  sources_breakdown: Record<string, number>;
  quality_breakdown: Record<string, number>;
  storage_tier: string;
}

export const ModelPerformancePage: React.FC = () => {
  /* The page only ever renders numbers the scoring service actually returned.
     No demonstration baseline is substituted when the audit log is empty. */
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<
    'all' | 'LightGBM_85Features_300Trees' | 'Idea_Evaluator' | 'Title_CTR_Predictor'
  >('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const [summaryRes, recentRes] = await Promise.all([
        api.get('/ml/evaluations/summary').catch(() => null),
        api.get('/ml/evaluations/recent?limit=50').catch(() => null),
      ]);

      const summaryData = summaryRes?.data?.data;
      if (summaryData && summaryData.total_evaluations > 0) {
        setSummary(summaryData);
      } else {
        setSummary(null);
      }

      const recentData = recentRes?.data?.data;
      setEvaluations(Array.isArray(recentData) ? recentData : []);

      setLastRefreshedAt(new Date());
      setLoadError(
        !summaryData && !recentData
          ? 'The evaluation audit service did not respond. Live metrics stay empty until it does.'
          : null
      );
    } catch {
      setLoadError('The evaluation audit service could not be reached.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Auto-refresh timer every 15 seconds */
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        (item.topic && item.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.model_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModel = modelFilter === 'all' || item.model_name === modelFilter;
      return matchesSearch && matchesModel;
    });
  }, [evaluations, searchQuery, modelFilter]);

  const qualityRows = useMemo(() => {
    const breakdown = summary?.quality_breakdown ?? {};
    const rows = [
      {
        key: 'high_accuracy',
        label: 'High Accuracy (RÂ² â‰¥ 0.85, CI â‰¥ 85%)',
        count: breakdown.high_accuracy ?? 0,
        color: '#167A59',
        track: '#E8FBF4',
      },
      {
        key: 'synthetic_calibrated',
        label: 'Prior Calibrated (Sparse Fallback < 7d)',
        count: breakdown.synthetic_calibrated ?? 0,
        color: '#7C5CD6',
        track: '#F1ECFF',
      },
      {
        key: 'moderate',
        label: 'Moderate / Broad Uncertainty Band',
        count: breakdown.moderate ?? 0,
        color: '#625D68',
        track: '#F1EEF5',
      },
    ];
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return rows.map((row) => ({
      ...row,
      pct: total > 0 ? (row.count / total) * 100 : 0,
    }));
  }, [summary]);

  const getQualityBadge = (quality: string = '') => {
    if (quality === 'high_accuracy') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8FBF4] px-2.5 py-0.5 text-xs font-semibold text-[#0F5C43] border border-[#B8EED8]">
          <CheckCircle2 className="h-3 w-3" /> High Accuracy
        </span>
      );
    }
    if (quality === 'synthetic_calibrated') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F1ECFF] px-2.5 py-0.5 text-xs font-semibold text-[#4A2E8F] border border-[#D9CEF5]">
          <Sparkles className="h-3 w-3" /> Prior Calibrated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EEF5] px-2.5 py-0.5 text-xs font-semibold text-[#625D68] border border-[#E5E0E8]">
        <Activity className="h-3 w-3" /> Moderate
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFAF8] font-sans text-[#171717]">
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* Header                                                        */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="sticky top-0 z-30 border-b border-[#E5E0E8] bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo to="/" size="md" />
            <div className="hidden h-4 w-px bg-[#E5E0E8] mx-1 sm:block" />
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-semibold uppercase tracking-wider text-[#77717F] sm:inline">
                Model integrity
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8FBF4] px-2.5 py-0.5 text-xs font-medium text-[#0F5C43] border border-[#B8EED8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#167A59]" />
                LightGBM v4.3 operational
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                autoRefresh
                  ? 'bg-[#F1ECFF] text-[#4A2E8F] border-[#D9CEF5]'
                  : 'bg-white text-[#77717F] border-[#E5E0E8] hover:bg-[#FBFAF8]'
              }`}
            >
              <Activity className={`h-3.5 w-3.5 ${autoRefresh ? 'text-[#7C5CD6]' : 'text-[#A79FB0]'}`} />
              Auto-refresh {autoRefresh ? '15s' : 'off'}
            </button>

            {/* Manual refresh button */}
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E0E8] bg-white px-3 py-1.5 text-xs font-medium text-[#625D68] transition-all hover:bg-[#F6F3FF] hover:text-[#171717] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#7C5CD6]' : ''}`} />
              Refresh
            </button>

            {/* Link back to app or login */}
            <Link
              to="/app/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FF98C1] px-3 py-1.5 text-xs font-semibold text-[#171717] transition-all hover:bg-[#FF8AB8]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Creator App
            </Link>
          </div>
        </div>
      </header>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* Main Container                                                 */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8 space-y-8">
        {/* Banner & Intro */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E5E0E8] bg-white p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#F1ECFF] border border-[#D9CEF5] px-2 py-0.5 text-xs font-medium text-[#4A2E8F]">
                  Model integrity & drift telemetry
                </span>
                {lastRefreshedAt && (
                  <span className="text-xs text-[#77717F]">
                    Updated {lastRefreshedAt.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-cal-sans tracking-tight text-[#171717]">
                Model performance & accuracy audit
              </h1>
              <p className="text-sm text-[#625D68] leading-relaxed">
                Empirical calibration, virality probability and execution latency logs for
                CreatorIQ&rsquo;s 85-feature LightGBM ensemble and PyTorch scoring models. Every
                number below is read from the evaluation audit log &mdash; nothing is simulated.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] p-3.5 text-center min-w-[140px]">
                <p className="text-xs text-[#77717F]">Storage backend</p>
                <p className="mt-1 text-sm font-semibold text-[#167A59] flex items-center justify-center gap-1">
                  <Database className="h-3.5 w-3.5" /> PostgreSQL + JSONL
                </p>
              </div>
              <div className="rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] p-3.5 text-center min-w-[140px]">
                <p className="text-xs text-[#77717F]">Model engine</p>
                <p className="mt-1 text-sm font-semibold text-[#4A2E8F] flex items-center justify-center gap-1">
                  <Cpu className="h-3.5 w-3.5" /> LightGBM 4.3 + PyTorch
                </p>
              </div>
            </div>
          </div>
        </div>

        {loadError && (
          <div
            role="alert"
            className="rounded-xl border border-[#F3C9CE] bg-[#FDF1F2] px-4 py-3 text-[13px] leading-relaxed text-[#8A1B26]"
          >
            {loadError}
          </div>
        )}

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* KPI Performance Metric Cards                                     */}
        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {summary ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#E5E0E8] bg-white p-5 transition-colors hover:border-[#C9BCF0]">
              <div className="flex items-center justify-between gap-2 text-xs text-[#77717F]">
                <span>Mean absolute error (MAE)</span>
                <span className="rounded bg-[#E8FBF4] px-1.5 py-0.5 font-medium text-[#0F5C43]">
                  &lt; 5.0 target
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold font-cal-sans text-[#171717]">
                {summary.avg_mae.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-[#77717F]">
                Average points deviation on ground-truth trajectory
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E0E8] bg-white p-5 transition-colors hover:border-[#C9BCF0]">
              <div className="flex items-center justify-between gap-2 text-xs text-[#77717F]">
                <span>95% CI coverage</span>
                <span className="rounded bg-[#F1ECFF] px-1.5 py-0.5 font-medium text-[#4A2E8F]">
                  Calibrated
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold font-cal-sans text-[#171717]">
                {summary.avg_ci_coverage_pct.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-[#77717F]">
                Empirical observations inside [yhat_lower, yhat_upper]
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E0E8] bg-white p-5 transition-colors hover:border-[#C9BCF0]">
              <div className="flex items-center justify-between gap-2 text-xs text-[#77717F]">
                <span>Average inference latency</span>
                <span className="rounded bg-[#F1ECFF] px-1.5 py-0.5 font-medium text-[#4A2E8F]">
                  &lt; 200ms
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold font-cal-sans text-[#171717]">
                {summary.avg_latency_ms.toFixed(1)}{' '}
                <span className="text-sm font-normal text-[#77717F]">ms</span>
              </p>
              <p className="mt-1 text-xs text-[#77717F]">
                Wall-clock 85-feature engineering &amp; 300-tree ensemble inference
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E0E8] bg-white p-5 transition-colors hover:border-[#C9BCF0]">
              <div className="flex items-center justify-between gap-2 text-xs text-[#77717F]">
                <span>Total predictions logged</span>
                <span className="rounded bg-[#F1EEF5] px-1.5 py-0.5 font-medium text-[#625D68]">
                  Audit stream
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold font-cal-sans text-[#171717]">
                {summary.total_evaluations}
              </p>
              <p className="mt-1 text-xs text-[#77717F]">
                Persisted across PostgreSQL &amp; rotating JSONL logs
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E5E0E8] bg-white p-8 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-[#A79FB0]" />
            <h2 className="mt-2 text-sm font-bold text-[#171717]">No evaluation metrics yet</h2>
            <p className="mx-auto mt-1.5 max-w-lg text-xs leading-relaxed text-[#625D68]">
              The audit log is still empty. Accuracy, latency and calibration figures appear here
              as soon as the scoring service records its first real evaluation.
            </p>
          </div>
        )}

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* Model Architecture & Quality Breakdown                          */}
        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quality Distribution */}
          <div className="lg:col-span-6 rounded-xl border border-[#E5E0E8] bg-white p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#171717] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#167A59]" />
                Goodness-of-fit quality distribution
              </h2>
              <span className="text-xs text-[#77717F]">RÂ² &gt; 0.85 benchmark</span>
            </div>

            <div className="space-y-3 pt-2">
              {qualityRows.map((row) => (
                <div key={row.key}>
                  <div className="flex justify-between gap-3 text-xs mb-1.5">
                    <span className="text-[#625D68] font-medium">{row.label}</span>
                    <span className="font-semibold text-[#171717]">
                      {summary ? `${row.count} runs` : 'â€”'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F1EEF5] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Theoretical Calibration Specifications */}
          <div className="lg:col-span-6 rounded-xl border border-[#E5E0E8] bg-white p-6 space-y-3">
            <h2 className="text-sm font-semibold text-[#171717] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#7C5CD6]" />
              LightGBM 85-feature architecture specifications
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="rounded-lg border border-[#E5E0E8] bg-[#FBFAF8] p-3">
                <p className="font-semibold text-[#171717]">1. SimpleImputer preprocessing</p>
                <p className="mt-1 text-[#625D68]">
                  Replaces missing numeric lags and rolling windows via median imputation before
                  tree evaluation.
                </p>
              </div>
              <div className="rounded-lg border border-[#E5E0E8] bg-[#FBFAF8] p-3">
                <p className="font-semibold text-[#171717]">2. Imbalanced class weighting</p>
                <p className="mt-1 text-[#625D68]">
                  Applies dynamic <code className="text-[#4A2E8F]">scale_pos_weight</code> so
                  minority viral breakouts are never ignored.
                </p>
              </div>
              <div className="rounded-lg border border-[#E5E0E8] bg-[#FBFAF8] p-3">
                <p className="font-semibold text-[#171717]">3. 300 sequential trees (lr=0.04)</p>
                <p className="mt-1 text-[#625D68]">
                  Gradient boosted decision trees trained sequentially at learning rate 0.04 over 85
                  features.
                </p>
              </div>
              <div className="rounded-lg border border-[#E5E0E8] bg-[#FBFAF8] p-3">
                <p className="font-semibold text-[#171717]">4. 85 longitudinal signals</p>
                <p className="mt-1 text-[#625D68]">
                  Combines 9 base metrics, 25 lags (1&ndash;28d), 40 rolling stats, 8
                  momentum/accel, &amp; 3 tier shares.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* Live Prediction Audit Feed & Table                              */}
        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="rounded-xl border border-[#E5E0E8] bg-white p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#171717] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#167A59]" />
                Live model evaluation stream
              </h2>
              <p className="text-xs text-[#625D68]">
                Audit log of recent inference runs, fitted error metrics, and operational latency.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A79FB0]" />
                <input
                  type="text"
                  placeholder="Filter topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="app-field h-8 w-44 sm:w-56 pl-8 pr-3 text-xs text-[#171717] placeholder-[#9B94A5] focus:outline-none"
                />
              </div>

              <select
                value={modelFilter}
                onChange={(e) =>
                  setModelFilter(e.target.value as
                    | 'all'
                    | 'LightGBM_85Features_300Trees'
                    | 'Idea_Evaluator'
                    | 'Title_CTR_Predictor')
                }
                className="app-field h-8 px-2 text-xs text-[#625D68] focus:outline-none"
              >
                <option value="all">All models</option>
                <option value="LightGBM_85Features_300Trees">LightGBM trend model</option>
                <option value="Idea_Evaluator">Idea evaluator</option>
                <option value="Title_CTR_Predictor">Title CTR predictor</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-[#E5E0E8]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBFAF8] border-b border-[#E5E0E8] text-[#77717F] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Topic / Entity</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Data Source</th>
                  <th className="py-3 px-4">MAE</th>
                  <th className="py-3 px-4">RMSE</th>
                  <th className="py-3 px-4">95% CI Cov</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Quality Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBF2] bg-white">
                {filteredEvaluations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[#77717F]">
                      {evaluations.length === 0
                        ? 'No evaluation records have been logged yet.'
                        : 'No model evaluation records match your filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredEvaluations.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`hover:bg-[#FBFAF8] transition-colors cursor-pointer ${
                          expandedId === item.id ? 'bg-[#F6F3FF]' : ''
                        }`}
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        <td className="py-3 px-4 font-mono text-[#77717F] whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#171717] max-w-[220px] truncate">
                          {item.topic || 'General opportunity'}
                        </td>
                        <td className="py-3 px-4 text-[#625D68] font-mono">{item.model_name}</td>
                        <td className="py-3 px-4 text-[#77717F]">
                          {item.data_source === 'real_history' ? (
                            <span className="inline-flex items-center gap-1 text-[#167A59]">
                              <Database className="h-3 w-3" /> Real signals ({item.observations_count}d)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#4A2E8F]">
                              <Sparkles className="h-3 w-3" /> Prior calibrated
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#171717]">
                          {item.mae != null ? item.mae.toFixed(2) : 'â€”'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#171717]">
                          {item.rmse != null ? item.rmse.toFixed(2) : 'â€”'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#171717]">
                          {item.ci_coverage_pct != null ? `${item.ci_coverage_pct.toFixed(1)}%` : 'â€”'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#625D68]">
                          {item.latency_ms.toFixed(1)} ms
                        </td>
                        <td className="py-3 px-4">{getQualityBadge(item.fit_quality)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            className="text-[#77717F] hover:text-[#171717] p-1 rounded transition-colors"
                            aria-label={
                              expandedId === item.id
                                ? 'Hide evaluation detail'
                                : 'Show evaluation detail'
                            }
                          >
                            {expandedId === item.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Detail Row */}
                      {expandedId === item.id && (
                        <tr className="bg-[#FBFAF8] border-b border-[#E5E0E8]">
                          <td colSpan={10} className="p-4">
                            <div className="rounded-lg border border-[#E5E0E8] bg-white p-4 font-mono text-xs text-[#625D68]">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EFEBF2]">
                                <span className="text-[#77717F] text-[11px]">
                                  Evaluation snapshot: ID {item.id}
                                </span>
                                <span className="text-[#167A59] text-[11px]">
                                  RÂ² score: {item.r2_score != null ? item.r2_score.toFixed(2) : 'â€”'}
                                  {' Â· '}
                                  CI:{' '}
                                  {item.ci_coverage_pct != null
                                    ? `${item.ci_coverage_pct.toFixed(1)}%`
                                    : 'â€”'}
                                </span>
                              </div>
                              <pre className="overflow-x-auto text-[11px] text-[#625D68] leading-relaxed custom-scrollbar">
                                {JSON.stringify(
                                  {
                                    model_name: item.model_name,
                                    topic: item.topic,
                                    data_source: item.data_source,
                                    observations_count: item.observations_count,
                                    latency_ms: item.latency_ms,
                                    metrics: {
                                      mae: item.mae,
                                      rmse: item.rmse,
                                      r2_score: item.r2_score,
                                      ci_coverage_pct: item.ci_coverage_pct,
                                      fit_quality: item.fit_quality,
                                    },
                                    raw_snapshot: item.metrics_payload || {},
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* Footer                                                           */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <footer className="mt-16 border-t border-[#E5E0E8] bg-white py-8 px-4 sm:px-8 text-center text-xs text-[#77717F]">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Â© 2026 CreatorIQ ML Systems Â· Public model performance &amp; accuracy telemetry</p>
          <div className="flex items-center gap-4 text-[#625D68]">
            <Link to="/" className="hover:text-[#171717] transition-colors">
              Home
            </Link>
            <Link to="/app/trends" className="hover:text-[#171717] transition-colors">
              Trends
            </Link>
            <Link to="/app/dashboard" className="hover:text-[#171717] transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
