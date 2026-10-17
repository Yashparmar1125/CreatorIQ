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

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  icon,
  className,
}) => (
  <div
    className={cn(
      'group relative flex items-center justify-between gap-3 rounded-xl border border-[#1c1c1c] bg-[#101010] px-4 py-3 transition-all duration-150 hover:border-[#2a2a2a] hover:bg-[#141414]',
      className
    )}
  >
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-lg font-bold tracking-tight text-neutral-200 metric">{value}</p>
        {trend && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400/80 truncate">
            <TrendingUp className="h-2.5 w-2.5 shrink-0" />
            {trend}
          </span>
        )}
      </div>
    </div>
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#242424] bg-[#161616] text-neutral-400">
      {icon}
    </div>
  </div>
);
