import React from 'react';
import type { TrendForecastData, Trend } from '../../../stores/useTrendsStore';
import { Activity, Info, TrendingUp } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TrendForecastChartProps {
  forecast: TrendForecastData;
  trend?: Trend | null;
  className?: string;
}

interface PlotPoint {
  day: number;
  value: number;
  lower?: number;
  upper?: number;
}

const WIDTH = 760;
const HEIGHT = 250;
const PAD_LEFT = 44;
const PAD_RIGHT = 18;
const PAD_TOP = 16;
const PAD_BOTTOM = 34;

function toDay(dateValue?: string): number | null {
  if (!dateValue) return null;
  const parsed = Date.parse(dateValue);
  if (Number.isNaN(parsed)) return null;
  return Math.floor(parsed / 86_400_000);
}

function formatDayLabel(dayValue: number): string {
  const date = new Date(dayValue * 86_400_000);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Light-theme demand chart.
 *
 * Measured daily signals (real observations) are drawn in lavender, the model
 * projection (Prophet / LightGBM trajectory) is drawn in pink with its
 * uncertainty band. The two are never blended, so a forecast is never
 * presented as an observation.
 */
export const TrendForecastChart: React.FC<TrendForecastChartProps> = ({
  forecast,
  trend,
  className,
}) => {
  const trajectory = forecast?.trajectory ?? [];

  const historyPoints: PlotPoint[] = (trend?.signal_history ?? []).flatMap((p) => {
    const day = toDay(p.video_date);
    const value = Number(p.trend_score_median);
    return day !== null && Number.isFinite(value) ? [{ day, value }] : [];
  });

  const forecastPoints: PlotPoint[] = trajectory.flatMap((p) => {
    const day = toDay(p.ds);
    const value = Number(p.yhat);
    if (day === null || !Number.isFinite(value)) return [];
    return [
      {
        day,
        value,
        lower: p.yhat_lower != null ? Number(p.yhat_lower) : undefined,
        upper: p.yhat_upper != null ? Number(p.yhat_upper) : undefined,
      },
    ];
  });

  if (historyPoints.length === 0 && forecastPoints.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed border-[#E5E0E8] bg-white p-8 text-center',
          className
        )}
      >
        <p className="text-xs font-semibold text-[#171717]">No demand history yet</p>
        <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-[#625D68]">
          This trend has no measured daily signals and no model trajectory yet. Refresh the
          feed once signals are collected and the chart will appear here.
        </p>
      </div>
    );
  }

  const allDays = [...historyPoints, ...forecastPoints].map((p) => p.day as number);
  const minDay = Math.min(...allDays);
  const maxDay = Math.max(...allDays);
  const daySpan = Math.max(1, maxDay - minDay);

  const chartWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const chartHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const x = (day: number) => PAD_LEFT + ((day - minDay) / daySpan) * chartWidth;
  const y = (value: number) =>
    PAD_TOP + chartHeight - (Math.max(0, Math.min(100, value)) / 100) * chartHeight;

  const historyPath = historyPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.day).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ');
  const historyArea =
    historyPoints.length > 1
      ? `${x(historyPoints[0].day).toFixed(1)},${(PAD_TOP + chartHeight).toFixed(1)} ${historyPath} ${x(
          historyPoints[historyPoints.length - 1].day
        ).toFixed(1)},${(PAD_TOP + chartHeight).toFixed(1)}`
      : '';

  const forecastPath = forecastPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.day).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ');

  const bandPath =
    forecastPoints.length > 1
      ? `${forecastPoints
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.day).toFixed(1)} ${y(p.upper ?? p.value).toFixed(1)}`)
          .join(' ')} ${[...forecastPoints]
          .reverse()
          .map((p) => `L ${x(p.day).toFixed(1)} ${y(p.lower ?? p.value).toFixed(1)}`)
          .join(' ')} Z`
      : '';

  const lastHistory = historyPoints[historyPoints.length - 1];

  const tickDays = Array.from(new Set([minDay, maxDay, Math.round((minDay + maxDay) / 2)])).sort(
    (a, b) => a - b
  );

  return (
    <div className={cn('rounded-xl border border-[#E5E0E8] bg-white p-4 sm:p-5', className)}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-[#171717]">
              <Activity className="h-4 w-4 text-[#7C5CD6]" />
              Demand trajectory
            </h3>
            {forecast?.model_used && (
              <span className="rounded-full border border-[#E5E0E8] bg-[#FBFAF8] px-2 py-0.5 text-[10px] font-semibold text-[#625D68]">
                {forecast.model_used}
              </span>
            )}
            {forecast?.observations_count != null && (
              <span className="rounded-full border border-[#E5E0E8] bg-[#FBFAF8] px-2 py-0.5 text-[10px] font-semibold text-[#625D68]">
                {forecast.observations_count} observations
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#625D68]">
            Measured signals and the model projection are shown separately.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full min-w-[520px]"
          role="img"
          aria-label={`Demand chart. ${historyPoints.length} measured days and ${forecastPoints.length} projected days.`}
        >
          {/* Grid */}
          {[0, 25, 50, 75, 100].map((value) => (
            <g key={value}>
              <line
                x1={PAD_LEFT}
                y1={y(value)}
                x2={WIDTH - PAD_RIGHT}
                y2={y(value)}
                stroke="#EFEBF2"
                strokeWidth={1}
                strokeDasharray={value === 0 ? undefined : '4 4'}
              />
              <text
                x={PAD_LEFT - 8}
                y={y(value) + 3.5}
                textAnchor="end"
                fill="#77717F"
                fontSize={10}
                fontWeight={600}
              >
                {value}
              </text>
            </g>
          ))}

          {/* Measured history */}
          {historyArea && <path d={historyArea} fill="#F1ECFF" />}
          {historyPath && (
            <path
              d={historyPath}
              fill="none"
              stroke="#7C5CD6"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {historyPoints.map((p) => (
            <circle key={`h-${p.day}`} cx={x(p.day)} cy={y(p.value)} r={2.4} fill="#7C5CD6" />
          ))}

          {/* Forecast uncertainty band */}
          {bandPath && <path d={bandPath} fill="#FFE4EE" />}

          {/* Forecast line */}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="#E0548A"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {forecastPoints.map((p) => (
            <circle
              key={`f-${p.day}`}
              cx={x(p.day)}
              cy={y(p.value)}
              r={2.4}
              fill="#E0548A"
              opacity={0.85}
            />
          ))}

          {/* Handoff marker */}
          {lastHistory && forecastPoints.length > 0 && (
            <line
              x1={x(lastHistory.day)}
              y1={PAD_TOP}
              x2={x(lastHistory.day)}
              y2={PAD_TOP + chartHeight}
              stroke="#C9BCF0"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {/* X axis */}
          {tickDays.map((day) => (
            <text
              key={`x-${day}`}
              x={x(day)}
              y={HEIGHT - PAD_BOTTOM + 18}
              textAnchor="middle"
              fill="#77717F"
              fontSize={10}
              fontWeight={600}
            >
              {formatDayLabel(day)}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#EFEBF2] pt-3 text-[11px] text-[#625D68]">
        {historyPoints.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-[#7C5CD6]" />
            Measured history ({historyPoints.length} days)
          </span>
        )}
        {forecastPoints.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-[#E0548A]" />
            Model projection ({forecastPoints.length} days)
          </span>
        )}
        {forecastPoints.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-sm bg-[#FFE4EE] ring-1 ring-[#F7C6D9]" />
            Projection range
          </span>
        )}
        {forecast?.data_source && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[#77717F]">
            <Info className="h-3.5 w-3.5" />
            Source: {forecast.data_source.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Horizon values */}
      {forecast?.horizons && (
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {(['1_week', '1_month', '3_months'] as const).map((key) => {
            const horizon = forecast.horizons[key];
            if (!horizon) return null;
            return (
              <div key={key} className="rounded-lg border border-[#EFEBF2] bg-[#FBFAF8] p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#77717F]">
                  {key === '1_week' ? '1 week' : key === '1_month' ? '1 month' : '3 months'}
                </span>
                <p className="mt-1 font-mono text-sm font-bold text-[#171717]">
                  {Number(horizon.forecast_score).toFixed(1)}
                </p>
                <p className="mt-0.5 text-[10px] text-[#77717F]">
                  Range {Number(horizon.lower_bound).toFixed(1)} –{' '}
                  {Number(horizon.upper_bound).toFixed(1)} · {horizon.direction}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-[#77717F]">
        <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        A projection is a model estimate, not a guarantee of future views. Validate against your own
        audience data before committing production time.
      </p>
    </div>
  );
};
