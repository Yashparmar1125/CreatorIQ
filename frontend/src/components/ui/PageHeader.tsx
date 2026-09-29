import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  className,
}) => (
  <header
    className={cn(
      'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
      className
    )}
  >
    <div className="min-w-0 space-y-1.5">
      {badge}
      <h1 className="text-xl font-bold font-sora text-[#ededed] tracking-tight sm:text-2xl lg:text-[1.75rem]">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-xs sm:text-sm text-neutral-400 leading-relaxed">{description}</p>
      )}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);
