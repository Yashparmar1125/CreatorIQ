import React from 'react';
import type { Trend } from '../../../stores/useTrendsStore';
import { TrendSparkline } from './TrendSparkline';

interface TrendMiniChartProps {
  trend: Trend;
}

function formatDay(value?: string): string {
  if (!value) return '';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Compact line chart for a trend card.
 *
 * Priority:
 *   1. Real daily signal series (>= 2 days) -> measured momentum line.
 *   2. Real scored uploads across publish dates -> tracked-upload score line.
 *   3. A single measured day -> flat baseline with the one real point, clearly
 *      labelled as "day 1" so no trend direction is implied.
 *
 * Nothing is synthesised: if the backend has not measured a value, no chart is
 * drawn.
 */
export const TrendMiniChart: React.FC<TrendMiniChartProps> = ({ trend }) => {
  const history = trend.signal_history ?? [];
  const series =
    trend.timeseries_recent && trend.timeseries_recent.length > 1
      ? trend.timeseries_recent
      : history.map((p) => Number(p.trend_score_median));

  /* 1. Measured daily momentum — a real time series. */
  if (series.length >= 2) {
    const first = series[0];
    const last = series[series.length - 1];
    const delta = first > 0 ? ((last - first) / first) * 100 : null;
    const rising = last > first;

    return (
      <div className="rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#77717F]">
            Measured momentum
          </span>
          {delta != null && (
            <span
              className={`font-mono text-[11px] font-bold ${
                rising ? 'text-[#167A59]' : delta === 0 ? 'text-[#625D68]' : 'text-[#B42332]'
              }`}
            >
              {delta >= 0 ? '+' : ''}
              {delta.toFixed(1)}% · {series.length}d
            </span>
          )}
        </div>
        <TrendSparkline
          values={series}
          startLabel={history[0]?.video_date}
          endLabel={history[history.length - 1]?.video_date}
          label="Daily trend score for this concept"
          className="mt-1"
        />
      </div>
    );
  }

  /* 2. Real scored uploads plotted by publish date. */
  const population = trend.population && trend.population.length > 0
    ? trend.population
    : trend.population_videos ?? [];

  const scored = population
    .filter(
      (v) =>
        v.trend_score != null &&
        Number.isFinite(Number(v.trend_score)) &&
        Boolean(v.published_at) &&
        !Number.isNaN(Date.parse(String(v.published_at))),
    )
    .sort((a, b) => Date.parse(String(a.published_at)) - Date.parse(String(b.published_at)));

  if (scored.length >= 2) {
    const values = scored.map((v) => Number(v.trend_score));
    return (
      <div className="rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#77717F]">
            Tracked upload scores
          </span>
          <span className="font-mono text-[11px] font-bold text-[#171717]">
            {scored.length} videos
          </span>
        </div>
        <TrendSparkline
          values={values}
          startLabel={scored[0].published_at}
          endLabel={scored[scored.length - 1].published_at}
          label="Trend score of each tracked upload, ordered by publish date"
          className="mt-1"
        />
      </div>
    );
  }

  /* 3. One measured day — show the real point without implying direction. */
  const single = series.length === 1 ? series[0] : null;
  if (single != null && Number.isFinite(single)) {
    return (
      <div className="rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#77717F]">
            Daily history
          </span>
          <span className="font-mono text-[11px] font-bold text-[#171717]">
            {single.toFixed(1)} / 100
          </span>
        </div>
        <svg
          viewBox="0 0 200 44"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Day 1 of daily history. Measured trend score ${single.toFixed(1)}.`}
          className="mt-1 h-11 w-full"
        >
          <title>Day 1 of daily history</title>
          <line
            x1="4"
            y1="22"
            x2="196"
            y2="22"
            stroke="#D9CEF5"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx="196" cy="22" r="3" fill="#7C5CD6" />
        </svg>
        <div className="mt-0.5 flex items-center justify-between text-[10px] font-medium text-[#77717F]">
          <span>{formatDay(history[0]?.video_date)}</span>
          <span>Line builds daily</span>
        </div>
      </div>
    );
  }

  return null;
};
