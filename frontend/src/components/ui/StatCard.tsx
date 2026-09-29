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
      'group relative overflow-hidden rounded-xl border border-[#222222] bg-[#121212] p-5 transition-all duration-200 hover:border-[#333333] hover:bg-[#151515]',
      className
    )}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-[#ededed] metric">{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-neutral-300">
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <TrendingUp className="h-3.5 w-3.5" />
        {trend}
      </div>
    )}
  </div>
);
