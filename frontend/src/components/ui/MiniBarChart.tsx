import React from 'react';
import { cn } from '../../lib/utils';

interface MiniBarChartProps {
  data: number[];
  className?: string;
  highlightIndex?: number;
  labels?: string[];
  unit?: string;
  formatValue?: (val: number) => string;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  className,
  highlightIndex,
  labels,
  unit = '%',
  formatValue,
}) => {
  const max = Math.max(...data, 1);
  const defaultLabels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];

  return (
    <div className={cn('w-full', className)}>
      <div className="flex h-44 w-full items-end gap-2 sm:gap-3 pt-6 pb-2 px-1">
        {data.map((value, i) => {
          const pct = Math.min(100, Math.max(8, Math.round((value / max) * 100)));
          const isHighlight = highlightIndex === i;
          const label = labels?.[i] ?? defaultLabels[i] ?? `W${i + 1}`;
          const displayVal = formatValue ? formatValue(value) : `${value}${unit}`;

          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end h-full select-none"
            >
              {/* Tooltip / Value on Hover */}
              <div className="absolute -top-7 z-20 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform -translate-y-0.5 group-hover:translate-y-0">
                <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-[11px] font-semibold text-white shadow-lg whitespace-nowrap">
                  {displayVal}
                </span>
                <div className="w-1.5 h-1.5 bg-neutral-900 rotate-45 -mt-1" />
              </div>

              {/* Bar track with explicit height ensuring reliable CSS percentage resolution */}
              <div className="relative flex h-32 sm:h-36 w-full items-end justify-center rounded-t-lg bg-neutral-100/60 p-0.5">
                {/* Colored Bar */}
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all duration-300',
                    isHighlight
                      ? 'bg-gradient-to-t from-brand-600 via-brand-500 to-indigo-400 shadow-md shadow-brand-500/25 ring-1 ring-brand-400/40'
                      : 'bg-gradient-to-t from-neutral-300 via-neutral-200 to-neutral-200 group-hover:from-brand-400/80 group-hover:to-brand-300/80'
                  )}
                  style={{ height: `${pct}%` }}
                />
              </div>

              {/* X-axis Label */}
              <span
                className={cn(
                  'mt-2 text-[11px] font-medium transition-colors',
                  isHighlight
                    ? 'font-semibold text-brand-600'
                    : 'text-neutral-400 group-hover:text-neutral-700'
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

