import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  icon: React.ReactNode;
  accent?: 'brand' | 'cyan' | 'emerald' | 'violet';
  className?: string;
}

const accentMap = {
  brand: 'from-brand-500/10 to-brand-600/5 text-brand-600 border-brand-200/50',
  cyan: 'from-cyan-500/10 to-cyan-600/5 text-cyan-600 border-cyan-200/50',
  emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-200/50',
  violet: 'from-violet-500/10 to-violet-600/5 text-violet-600 border-violet-200/50',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  icon,
  accent = 'brand',
  className,
}) => (
  <div
    className={cn(
      'surface-card-elevated group relative overflow-hidden rounded-xl p-5',
      className
    )}
  >
    <div
      className={cn(
        'pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-80',
        accentMap[accent].split(' ').slice(0, 2).join(' ')
      )}
    />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 metric">{value}</p>
      </div>
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br',
          accentMap[accent]
        )}
      >
        {icon}
      </div>
    </div>
    {trend && (
      <div className="relative mt-4 flex items-center gap-1.5 text-xs font-medium text-success-600">
        <TrendingUp className="h-3.5 w-3.5" />
        {trend}
      </div>
    )}
  </div>
);
