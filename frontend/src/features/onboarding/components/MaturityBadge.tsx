import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type ProfileMaturity = 'new' | 'emerging' | 'established';

const LABELS: Record<ProfileMaturity, { label: string; className: string }> = {
  new: { label: 'New Channel', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  emerging: { label: 'Growing', className: 'bg-brand-600/10 text-brand-400 border-brand-600/20' },
  established: { label: 'Established', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
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
        'inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border',
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  );
};
