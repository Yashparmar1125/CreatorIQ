import React from 'react';
import { cn } from '../../lib/utils';

type CardVariant = 'default' | 'elevated' | 'glass' | 'dark';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  variant?: CardVariant;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
};

const variantMap: Record<CardVariant, string> = {
  default: 'rounded-xl border border-neutral-200 bg-white shadow-sm',
  elevated: 'surface-card-elevated rounded-xl',
  glass: 'surface-glass rounded-xl shadow-sm',
  dark: 'surface-dark rounded-xl text-white',
};

export const Card: React.FC<CardProps> = ({
  className,
  padding = 'md',
  hover = false,
  variant = 'default',
  children,
  ...props
}) => (
  <div
    className={cn(
      variantMap[variant],
      paddingMap[padding],
      hover && variant !== 'elevated' && 'premium-shadow-hover',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
