import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type ProfileMaturity = 'new' | 'emerging' | 'established';

const LABELS: Record<ProfileMaturity, { label: string; className: string }> = {
  new: { label: 'New Channel', className: 'bg-amber-50 text-amber-800 border-amber-300' },
  emerging: { label: 'Growing', className: 'bg-[#f0ebff] text-[#6035c0] border-[#d8cbf9]' },
  established: { label: 'Established', className: 'bg-[#ecfaf2] text-[#065f46] border-[#a7f3d0]' },
};

interface MaturityBadgeProps {
  maturity: ProfileMaturity;
  className?: string;
}

export const MaturityBadge: React.FC<MaturityBadgeProps> = ({ maturity, className }) => {
  const cfg = LABELS[maturity] ?? LABELS.new;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs',
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  );
};
