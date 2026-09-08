import React from 'react';
import type { TrendForecastData } from '../../../stores/useTrendsStore';
import { TrendingUp, TrendingDown, Minus, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface TrendForecastChartProps {
  forecast: TrendForecastData;
}

export const TrendForecastChart: React.FC<TrendForecastChartProps> = ({ forecast }) => {
  const { trajectory, horizons, current_score, metrics, model_used, data_source, observations_count } = forecast;

  if (!trajectory || trajectory.length === 0) {
    return (
      <Card variant="elevated" className="p-6">
        <p className="text-sm text-neutral-500">No trajectory points available.</p>
      </Card>
    );
  }

  // Downsample to max 30 points for crisp visual SVG rendering
  const step = Math.max(1, Math.floor(trajectory.length / 28));
  const points = trajectory.filter((_, idx) => idx % step === 0 || idx === trajectory.length - 1);

  const width = 800;
  const height = 260;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const allScores = [
    current_score,
    ...points.map((p) => p.yhat),
    ...points.map((p) => p.yhat_upper),
    ...points.map((p) => p.yhat_lower),
  ];

  const minVal = Math.max(0, Math.min(...allScores) - 5);
  const maxVal = Math.min(100, Math.max(...allScores) + 5);
  const range = maxVal - minVal || 1;

  const coordPoints = points.map((p, idx) => {
    const x = paddingLeft + (idx / (points.length - 1 || 1)) * chartWidth;
    const yHat = paddingTop + chartHeight - ((p.yhat - minVal) / range) * chartHeight;
    const yLower = paddingTop + chartHeight - ((p.yhat_lower - minVal) / range) * chartHeight;
    const yUpper = paddingTop + chartHeight - ((p.yhat_upper - minVal) / range) * chartHeight;
    return { x, yHat, yLower, yUpper, ...p };
  });

  // Build SVG Path for Mean Trajectory Line
  const lineD = coordPoints.reduce(
    (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.yHat}`,
    ''
  );

  // Build SVG Path for 95% Confidence Interval Shaded Area
  const upperPath = coordPoints.reduce(
    (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.yUpper}`,
    ''
  );
  const lowerPathReversed = [...coordPoints]
    .reverse()
    .reduce((acc, pt) => `${acc} L ${pt.x} ${pt.yLower}`, '');
  const areaD = `${upperPath} ${lowerPathReversed} Z`;

  const getDirectionIcon = (direction: string) => {
    if (direction.includes('increase')) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (direction.includes('decrease')) return <TrendingDown className="h-4 w-4 text-rose-500" />;
    return <Minus className="h-4 w-4 text-neutral-400" />;
  };

  const getUncertaintyBadge = (uncertainty: string) => {
    if (uncertainty === 'low') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200/80">
          <Sparkles className="h-3 w-3" /> High Confidence
        </span>
      );
    }
    if (uncertainty === 'high') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-200/80">
          <ShieldAlert className="h-3 w-3" /> Broad Uncertainty Band
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 border border-neutral-200/80">
        <Activity className="h-3 w-3" /> Moderate Confidence
      </span>
    );
  };

  return (
    <Card variant="elevated" className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-neutral-900">
              Prophet Time-Series Trajectory Forecast
            </h3>
            <span className="rounded bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 border border-brand-200/60">
              {model_used}
            </span>
            {data_source === 'real_history' && (
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80">
                Empirical Signals ({observations_count ?? 0} pts)
              </span>
            )}
            {data_source === 'synthetic_prior_fallback' && (
              <span
                className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/80"
                title="Cold-start fallback: <7 empirical observations recorded, calibrated prior used"
              >
                Synthetic Prior (&lt;7 pts Fallback)
              </span>
            )}
            {data_source === 'heuristic_fallback' && (
              <span className="rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200/80">
                Heuristic Fallback
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            90-day forward projection with 95% Bayesian credible interval and trend derivatives.
          </p>
        </div>
        {getUncertaintyBadge(metrics.uncertainty)}
      </div>

      {/* Horizon summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {horizons['1_week'] && (
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">1 Week Ahead</span>
              {getDirectionIcon(horizons['1_week'].direction)}
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-bold text-neutral-900">
                {horizons['1_week'].forecast_score}
              </span>
              <span
                className={`text-xs font-semibold ${
                  horizons['1_week'].change_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {horizons['1_week'].change_pct >= 0 ? '+' : ''}
                {horizons['1_week'].change_pct}%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              Target: {horizons['1_week'].target_date}
            </p>
          </div>
        )}

        {horizons['1_month'] && (
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">1 Month Ahead</span>
              {getDirectionIcon(horizons['1_month'].direction)}
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-bold text-neutral-900">
                {horizons['1_month'].forecast_score}
              </span>
              <span
                className={`text-xs font-semibold ${
                  horizons['1_month'].change_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {horizons['1_month'].change_pct >= 0 ? '+' : ''}
                {horizons['1_month'].change_pct}%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              Range: {horizons['1_month'].lower_bound} – {horizons['1_month'].upper_bound}
            </p>
          </div>
        )}

        {horizons['3_months'] && (
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">3 Months Horizon</span>
              {getDirectionIcon(horizons['3_months'].direction)}
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-bold text-neutral-900">
                {horizons['3_months'].forecast_score}
              </span>
              <span
                className={`text-xs font-semibold ${
                  horizons['3_months'].change_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {horizons['3_months'].change_pct >= 0 ? '+' : ''}
                {horizons['3_months'].change_pct}%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              Velocity: {metrics.avg_velocity > 0 ? '+' : ''}
              {metrics.avg_velocity}/day
            </p>
          </div>
        )}
      </div>

      {/* Responsive SVG Forecast Graph */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="forecast-band-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + chartHeight * ratio;
            const val = Math.round(maxVal - ratio * range);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-neutral-400 text-[10px]"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* 95% Confidence Interval Area */}
          <path d={areaD} fill="url(#forecast-band-gradient)" />

          {/* Trajectory Mean Line */}
          <path
            d={lineD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 3"
          />

          {/* Points & Horizon Markers */}
          {coordPoints.map((pt, idx) => {
            const isKey =
              idx === 0 ||
              idx === coordPoints.length - 1 ||
              idx === Math.floor(coordPoints.length / 3) ||
              idx === Math.floor((coordPoints.length * 2) / 3);
            if (!isKey) return null;
            return (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.yHat}
                  r="4"
                  className="fill-indigo-600 stroke-white"
                  strokeWidth="2"
                />
                <text
                  x={pt.x}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  className="fill-neutral-500 font-medium text-[10px]"
                >
                  {pt.ds.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 pt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-neutral-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            Expected Trend Score
          </span>
          <span className="flex items-center gap-1.5 font-medium text-neutral-700">
            <span className="h-2.5 w-4 rounded-xs bg-indigo-500/20 border border-indigo-400/50" />
            95% Confidence Band
          </span>
        </div>
        <span className="text-neutral-400">Origin: {forecast.origin_date}</span>
      </div>
    </Card>
  );
};
