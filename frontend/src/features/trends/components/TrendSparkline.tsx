import React from 'react';
import { cn } from '../../../lib/utils';

interface TrendSparklineProps {
  /** Real measured values (daily trend score). Never synthesised. */
  values: number[];
  /** Optional real dates for the first and last measured point. */
  startLabel?: string;
  endLabel?: string;
  /** Human readable context for assistive technology. */
  label: string;
  className?: string;
}

function formatDate(value?: string): string {
  if (!value) return '';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Compact momentum sparkline drawn from the real daily signal series returned
 * by the trends API. Renders nothing when fewer than two real points exist so
 * a card never shows an invented trend direction.
 */
export const TrendSparkline: React.FC<TrendSparklineProps> = ({
  values,
  startLabel,
  endLabel,
  label,
  className,
}) => {
  const points = values.filter((v) => Number.isFinite(v));

  if (points.length < 2) return null;

  const width = 200;
  const height = 44;
  const padding = 4;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const coords = points.map((value, index) => {
    const x = padding + (index / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / span) * (height - padding * 2);
    return { x, y };
  });

  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;
  const first = points[0];
  const last = points[points.length - 1];
  const rising = last > first;
  const flat = last === first;
  const stroke = flat ? '#77717F' : rising ? '#167A59' : '#B42332';
  const fill = flat ? '#F6F3FF' : rising ? '#E8FBF4' : '#FDECEF';

  const startText = formatDate(startLabel);
  const endText = formatDate(endLabel);

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}. First measured value ${first}, latest measured value ${last}.`}
        className="h-11 w-full"
      >
        <title>{label}</title>
        <polygon points={area} fill={fill} />
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r={2.8} fill={stroke} />
      </svg>
      {(startText || endText) && (
        <div className="mt-0.5 flex items-center justify-between text-[10px] font-medium text-[#77717F]">
          <span>{startText}</span>
          <span>{endText}</span>
        </div>
      )}
    </div>
  );
};
