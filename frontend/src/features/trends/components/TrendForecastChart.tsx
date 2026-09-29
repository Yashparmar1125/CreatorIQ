import React, { useState } from 'react';
import type { TrendForecastData, Trend } from '../../../stores/useTrendsStore';
import {
  Eye,
  Clock,
  TrendingUp,
  Sparkles,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
  Film,
  Tv,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { calculateViewPossibilities } from '../../../lib/viewEstimator';

interface TrendForecastChartProps {
  forecast: TrendForecastData;
  trend?: Trend | null;
}

export const TrendForecastChart: React.FC<TrendForecastChartProps> = ({ forecast, trend }) => {
  const [showExplainability, setShowExplainability] = useState(false);
  const { trajectory, origin_date } = forecast;

  const possibility = calculateViewPossibilities(
    trend || {
      tvs_score: forecast.current_score,
      supported_formats: ['shorts', 'both'],
    },
    forecast
  );

  if (!trajectory || trajectory.length === 0) {
    return (
      <Card variant="elevated" className="p-6 border-[#222222] bg-[#121212]">
        <p className="text-xs text-neutral-500">No trajectory points available.</p>
      </Card>
    );
  }

  // Downsample to max 28 points for clean SVG rendering
  const step = Math.max(1, Math.floor(trajectory.length / 28));
  const rawPoints = trajectory.filter((_, idx) => idx % step === 0 || idx === trajectory.length - 1);

  const width = 800;
  const height = 240;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Map trajectory directly to 0-100% Audience Demand scale
  const normalizedPoints = rawPoints.map((p) => {
    const demand = Math.round(Math.max(5, Math.min(100, p.yhat)));
    const normLower = Math.round(Math.max(0, Math.min(100, p.yhat_lower ?? (demand - 8))));
    const normUpper = Math.round(Math.max(0, Math.min(100, p.yhat_upper ?? (demand + 8))));

    return {
      ...p,
      demand,
      normLower,
      normUpper,
    };
  });

  const coordPoints = normalizedPoints.map((p, idx) => {
    const x = paddingLeft + (idx / (normalizedPoints.length - 1 || 1)) * chartWidth;
    const yDemand = paddingTop + chartHeight - (p.demand / 100) * chartHeight;
    const yLower = paddingTop + chartHeight - (p.normLower / 100) * chartHeight;
    const yUpper = paddingTop + chartHeight - (p.normUpper / 100) * chartHeight;
    return { x, yDemand, yLower, yUpper, ...p };
  });

  // SVG paths
  const lineD = coordPoints.reduce(
    (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.yDemand}`,
    ''
  );

  const upperPath = coordPoints.reduce(
    (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.yUpper}`,
    ''
  );
  const lowerPathReversed = [...coordPoints]
    .reverse()
    .reduce((acc, pt) => `${acc} L ${pt.x} ${pt.yLower}`, '');
  const areaD = `${upperPath} ${lowerPathReversed} Z`;

  return (
    <Card variant="elevated" className="space-y-4 p-5 border-[#222222] bg-[#121212] text-[#ededed]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e1e] pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Audience Demand & View Possibilities
            </h3>
            <span className="inline-flex items-center gap-1 rounded bg-[#1e1b4b] px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-[#3730a3]">
              <Sparkles className="h-3 w-3" /> Growth Projections
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[#0e2316] px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-[#166534]">
              <Flame className="h-3 w-3" /> {possibility.urgency}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-400">
            Projected reach, optimal publishing window, and estimated view potential.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowExplainability(!showExplainability)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-[#181818] hover:bg-[#202020] px-2.5 py-1.5 rounded-lg border border-[#2c2c2c] transition-colors cursor-pointer"
        >
          <Info className="h-3.5 w-3.5" />
          <span>Calculation model</span>
          {showExplainability ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Explainability Accordion */}
      {showExplainability && (
        <div className="rounded-lg border border-[#2a2a2a] bg-[#161616] p-4 animate-in">
          <div className="flex items-center gap-2 mb-2.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-200">
              Calculation Model Factors
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {possibility.explainabilityPoints.map((pt, idx) => (
              <div key={idx} className="rounded-lg bg-[#111111] p-2.5 border border-[#242424]">
                <p className="font-semibold text-neutral-200">{pt.title}</p>
                <p className="mt-1 text-neutral-400 leading-relaxed text-[11px]">{pt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Three Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Card 1: Estimated Views */}
        <div className="rounded-lg border border-[#222222] bg-[#161616] p-3.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400">
              <Eye className="h-3.5 w-3.5 text-indigo-400" /> Estimated Views
            </span>
            <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-semibold text-neutral-400 border border-[#2a2a2a]">
              Potential
            </span>
          </div>
          <div className="mt-1.5">
            <span className="text-xl font-bold text-white tracking-tight metric">
              {possibility.primaryRangeLabel}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <Film className="h-3 w-3 text-neutral-400" />
              Shorts: <strong className="text-neutral-200">{possibility.shortsRangeLabel}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <Tv className="h-3 w-3 text-neutral-400" />
              Video: <strong className="text-neutral-200">{possibility.longFormRangeLabel}</strong>
            </span>
          </div>
        </div>

        {/* Card 2: Optimal Publishing Window */}
        <div className="rounded-lg border border-[#222222] bg-[#161616] p-3.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400">
              <Clock className="h-3.5 w-3.5 text-amber-400" /> Optimal Window
            </span>
            <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-semibold text-neutral-400 border border-[#2a2a2a]">
              Timing
            </span>
          </div>
          <div className="mt-1.5">
            <span className="text-xl font-bold text-white tracking-tight metric">
              {possibility.optimalWindow}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-emerald-400 leading-snug">
            {possibility.urgency}
          </p>
        </div>

        {/* Card 3: Reach Multiplier */}
        <div className="rounded-lg border border-[#222222] bg-[#161616] p-3.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Reach Multiplier
            </span>
            <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-semibold text-neutral-400 border border-[#2a2a2a]">
              Velocity
            </span>
          </div>
          <div className="mt-1.5">
            <span className="text-xl font-bold text-white tracking-tight metric">
              {possibility.reachMultiplier}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-indigo-400 leading-snug">
            {possibility.reachDescription}
          </p>
        </div>
      </div>

      {/* Dark Audience Demand Trajectory Curve */}
      <div className="rounded-lg border border-[#222222] bg-[#0f0f0f] p-3.5">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-semibold text-neutral-300">Audience Demand Momentum Lifecycle</span>
          <span className="text-[11px] text-neutral-500">30-Day Algorithm Projection</span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="demand-band-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="demand-line-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a5b4fc" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[
            { ratio: 0, label: '100% Peak' },
            { ratio: 0.25, label: '75% High' },
            { ratio: 0.5, label: '50% Med' },
            { ratio: 0.75, label: '25% Low' },
          ].map((grid, i) => {
            const y = paddingTop + chartHeight * grid.ratio;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1c1c1c"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-neutral-600 font-medium text-[9px]"
                >
                  {grid.label}
                </text>
              </g>
            );
          })}

          {/* Shaded Confidence / Reach Band */}
          <path d={areaD} fill="url(#demand-band-gradient)" />

          {/* Trajectory Demand Line */}
          <path
            d={lineD}
            fill="none"
            stroke="url(#demand-line-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Timeline Milestones */}
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
                  cy={pt.yDemand}
                  r="3.5"
                  className="fill-indigo-400 stroke-[#0f0f0f]"
                  strokeWidth="2"
                />
                <text
                  x={pt.x}
                  y={height - paddingBottom + 16}
                  textAnchor="middle"
                  className="fill-neutral-500 font-medium text-[9px]"
                >
                  {pt.ds.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Lifecycle Phase Strip */}
        <div className="mt-2.5 pt-2 border-t border-[#1a1a1a] grid grid-cols-3 text-center text-[10px] font-medium text-neutral-500">
          <div className="flex items-center justify-center gap-1 text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <span>1. Early Breakout Wave</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>2. Peak Virality (Active)</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-neutral-600">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
            <span>3. Market Saturation</span>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-500 pt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Projected Audience Demand
          </span>
          <span className="flex items-center gap-1.5 font-medium text-neutral-400">
            <span className="h-2 w-3 rounded-xs bg-indigo-500/20 border border-indigo-400/40" />
            Expected Reach Range
          </span>
        </div>
        <span className="text-neutral-500">Signal Origin: {origin_date}</span>
      </div>
    </Card>
  );
};
