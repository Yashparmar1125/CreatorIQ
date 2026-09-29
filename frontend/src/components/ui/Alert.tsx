import React from 'react';
import { cn } from '../../lib/utils';

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-[#451a1a] bg-[#1e1010] text-[#fca5a5]',
  success: 'border-[#14381e] bg-[#0c1f12] text-[#86efac]',
  info: 'border-[#2e2b69] bg-[#15132d] text-[#c7d2fe]',
  warning: 'border-[#4a2e0e] bg-[#221405] text-[#fde68a]',
};

export const Alert: React.FC<AlertProps> = ({ children, variant = 'info', className }) => (
  <div className={cn('rounded-lg border px-4 py-3 text-sm', variantClasses[variant], className)}>
    {children}
  </div>
);
