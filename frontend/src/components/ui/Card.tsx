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
  sm: 'p-3.5',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
};

const variantMap: Record<CardVariant, string> = {
  default: 'rounded-xl border border-[#222222] bg-[#121212] text-[#ededed]',
  elevated: 'rounded-xl border border-[#282828] bg-[#161616] text-[#ededed] shadow-lg shadow-black/40',
  glass: 'rounded-xl border border-[#222222] bg-[#131313] text-[#ededed]',
  dark: 'rounded-xl border border-[#262626] bg-[#0e0e0e] text-[#ededed]',
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
      hover && 'transition-all duration-200 hover:border-[#3a3a3a] hover:bg-[#181818]',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
