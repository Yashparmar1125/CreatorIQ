import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-600',
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-green-50 text-success-600',
  warning: 'bg-amber-50 text-warning-600',
  neutral: 'bg-neutral-50 text-neutral-500 border border-neutral-200',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
      variantClasses[variant],
      className
    )}
  >
    {children}
  </span>
);
