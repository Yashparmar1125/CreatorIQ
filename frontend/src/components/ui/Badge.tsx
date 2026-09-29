import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#1c1c1c] text-[#a1a1aa] border border-[#282828]',
  brand: 'bg-[#1b1938] text-[#a5b4fc] border border-[#3730a3]',
  success: 'bg-[#0e2316] text-[#4ade80] border border-[#166534]',
  warning: 'bg-[#291905] text-[#fbbf24] border border-[#78350f]',
  neutral: 'bg-[#181818] text-[#a1a1aa] border border-[#262626]',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium tracking-tight',
      variantClasses[variant],
      className
    )}
  >
    {children}
  </span>
);
