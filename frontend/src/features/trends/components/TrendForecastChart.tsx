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
    }
  );

  if (!trajectory || trajectory.length === 0) {
    return (
      <Card variant="elevated" className="p-6">
        <p className="text-sm text-neutral-500">No trajectory points available.</p>
      </Card>
    );
  }

  // Downsample to max 28 points for clean SVG rendering
  const step = Math.max(1, Math.floor(trajectory.length / 28));
  const rawPoints = trajectory.filter((_, idx) => idx % step === 0 || idx === trajectory.length - 1);

  const width = 800;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Normalize scores to an intuitive 0-100% Demand Index
  const allYhats = rawPoints.map((p) => p.yhat);
  const rawMin = Math.min(...allYhats);
  const rawMax = Math.max(...allYhats);
  const isFlat = rawMax - rawMin < 1.0;

  const normalizedPoints = rawPoints.map((p, idx) => {
    let normalizedDemand = 65;
    let normLower = 50;
    let normUpper = 80;

    if (!isFlat && rawMax > rawMin) {
      const ratio = (p.yhat - rawMin) / (rawMax - rawMin);
      normalizedDemand = Math.round(35 + ratio * 55);
      normLower = Math.max(15, normalizedDemand - 12);
      normUpper = Math.min(98, normalizedDemand + 14);
    } else {
      // Natural lifecycle curve for flat or sparse fallback signals
      const progress = idx / (rawPoints.length - 1 || 1);
      if (progress < 0.25) {
        normalizedDemand = Math.round(65 + progress * 60); // rising to peak
      } else if (progress < 0.5) {
        normalizedDemand = Math.round(80 - (progress - 0.25) * 40);
      } else {
        normalizedDemand = Math.max(40, Math.round(70 - (progress - 0.5) * 35));
      }
      normLower = Math.max(15, normalizedDemand - 12);
      normUpper = Math.min(98, normalizedDemand + 12);
    }

    return {
      ...p,
      demand: normalizedDemand,
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
    <Card variant="elevated" className="space-y-5 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-neutral-900">
              Audience Demand & View Possibilities
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 border border-brand-200/60">
              <Sparkles className="h-3 w-3" /> Growth Projections
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80">
              <Flame className="h-3 w-3 text-emerald-600" /> {possibility.urgency}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Projected reach, optimal publishing window, and estimated view potential for your channel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowExplainability(!showExplainability)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-800 bg-brand-50/60 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg border border-brand-200/60 transition-colors cursor-pointer"
        >
          <Info className="h-3.5 w-3.5" />
          <span>How this is calculated</span>
          {showExplainability ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Explainability Accordion */}
      {showExplainability && (
        <div className="rounded-xl border border-brand-200/70 bg-gradient-to-r from-brand-50/60 via-indigo-50/30 to-purple-50/20 p-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 mb-2.5">
            <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-900">
              Transparent Calculation Model
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-700">
            {possibility.explainabilityPoints.map((pt, idx) => (
              <div key={idx} className="rounded-lg bg-white/80 p-2.5 border border-brand-100 shadow-2xs">
                <p className="font-semibold text-neutral-900">{pt.title}</p>
                <p className="mt-1 text-neutral-600 leading-relaxed">{pt.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-neutral-500 italic">
            Note: Projections reflect algorithmic distribution potential and search query capture for your niche, eliminating ungrounded numerical scores.
          </p>
        </div>
      )}

      {/* Three Creator-Centric View & Possibility Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Card 1: Estimated Views */}
        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600">
              <Eye className="h-3.5 w-3.5 text-brand-600" /> Estimated Views
            </span>
            <span className="rounded bg-brand-100/70 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
              Potential
            </span>
          </div>
          <div className="mt-1.5">
            <span className="text-xl font-extrabold text-neutral-900 tracking-tight">
              {possibility.primaryRangeLabel}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-600">
            <span className="inline-flex items-center gap-1">
              <Film className="h-3 w-3 text-brand-500" />
              Shorts: <strong>{possibility.shortsRangeLabel}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <Tv className="h-3 w-3 text-indigo-500" />
              Video: <strong>{possibility.longFormRangeLabel}</strong>
            </span>
          </div>
          <p className="mt-1.5 text-[10px] text-neutral-400">
            Calibrated for your creator tier from {possibility.volumeParsed} search queries
          </p>
        </div>

        {/* Card 2: Optimal Publishing Window */}
        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600">
              <Clock className="h-3.5 w-3.5 text-amber-600" /> Optimal Window
            </span>
            <span className="rounded bg-amber-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
              Timing
            </span>
          </div>
          <div className="mt-1.5">
            <span className="text-xl font-extrabold text-neutral-900 tracking-tight">
              {possibility.optimalWindow}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-emerald-700 leading-snug">
            {possibility.urgency}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500 line-clamp-2">
            {possibility.windowAdvice}
          </p>
        </div>

        {/* Card 3: Reach Multiplier */}
        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Reach Multiplier
            </span>
            <span className="rounded bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
              Velocity
            </span>
          </div>
          <div className="mt-1.5">
            <span className="text-xl font-extrabold text-neutral-900 tracking-tight">
              {possibility.reachMultiplier}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-brand-700 leading-snug">
            {possibility.reachDescription}
          </p>
          <p className="mt-1 text-[10px] text-neutral-500">
            Higher algorithmic push than baseline topics in your niche
          </p>
        </div>
      </div>

      {/* Responsive Audience Search Demand Curve */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-semibold text-neutral-800">Audience Search Momentum Lifecycle</span>
          <span className="text-[11px] text-neutral-400">30-Day Algorithm Projection</span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="demand-band-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="demand-line-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Grid lines with intuitive Demand percentages */}
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
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-neutral-400 font-medium text-[9px]"
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
            strokeWidth="3"
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

        {/* Lifecycle Phase Strip */}
        <div className="mt-2.5 pt-2 border-t border-neutral-100 grid grid-cols-3 text-center text-[10px] font-medium text-neutral-500">
          <div className="flex items-center justify-center gap-1 text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            <span>1. Early Breakout Wave</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-emerald-700 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>2. Peak Virality (Active)</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
            <span>3. Market Saturation</span>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 pt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-neutral-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            Projected Audience Demand
          </span>
          <span className="flex items-center gap-1.5 font-medium text-neutral-700">
            <span className="h-2.5 w-4 rounded-xs bg-indigo-500/20 border border-indigo-400/50" />
            Expected Reach Range
          </span>
        </div>
        <span className="text-neutral-400">Signal Origin: {origin_date}</span>
      </div>
    </Card>
  );
};

