import React from 'react';
import { cn } from '../../lib/utils';

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-brand-200 bg-brand-50 text-brand-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

export const Alert: React.FC<AlertProps> = ({ children, variant = 'info', className }) => (
  <div className={cn('rounded-lg border px-4 py-3 text-sm', variantClasses[variant], className)}>
    {children}
  </div>
);
