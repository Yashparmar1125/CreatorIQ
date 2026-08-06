import React from 'react';
import { cn } from '../../lib/utils';

interface MiniBarChartProps {
  data: number[];
  className?: string;
  highlightIndex?: number;
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  className,
  highlightIndex,
}) => {
  const max = Math.max(...data, 1);

  return (
    <div className={cn('flex h-40 items-end gap-1.5 sm:gap-2', className)}>
      {data.map((value, i) => {
        const height = Math.max((value / max) * 100, 8);
        const isHighlight = highlightIndex === i;

        return (
          <div key={i} className="group flex flex-1 flex-col items-center gap-2">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className={cn(
                  'w-full rounded-t-md transition-all duration-300 group-hover:opacity-90',
                  isHighlight ? 'chart-bar shadow-md shadow-brand-600/20' : 'chart-bar-muted opacity-70'
                )}
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-neutral-400">
              {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'][i] ?? ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};
