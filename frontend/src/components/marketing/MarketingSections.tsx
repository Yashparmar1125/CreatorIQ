import React from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/utils';

interface MarketingHeroProps {
  badge?: string;
  badgeIcon?: React.ReactNode;
  title: React.ReactNode;
  description: string;
  actions?: React.ReactNode;
  visual?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  centered?: boolean;
}

export const MarketingHero: React.FC<MarketingHeroProps> = ({
  badge,
  badgeIcon,
  title,
  description,
  actions,
  visual,
  footer,
  className,
  centered = !visual,
}) => (
  <section
    className={cn(
      'relative overflow-hidden border-b border-neutral-200 bg-white',
      'bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px]',
      className
    )}
  >
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50/50 via-white/90 to-white" />
    <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />
    <div
      className={cn(
        'relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24',
        visual ? 'grid items-center gap-12 lg:grid-cols-2 lg:gap-16' : '',
        centered && !visual && 'text-center'
      )}
    >
      <div className={cn(centered && !visual && 'mx-auto max-w-3xl')}>
        {badge && (
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-brand-700 shadow-sm backdrop-blur-sm">
            {badgeIcon}
            {badge}
          </p>
        )}
        <h1
          className={cn(
            'font-sora text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]',
            centered && !visual && 'mx-auto max-w-3xl'
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            'mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg',
            centered && !visual && 'mx-auto'
          )}
        >
          {description}
        </p>
        {actions && (
          <div className={cn('mt-8 flex flex-wrap gap-3', centered && !visual && 'justify-center')}>
            {actions}
          </div>
        )}
        {footer}
      </div>
      {visual && <div className="relative">{visual}</div>}
    </div>
  </section>
);

interface MarketingSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
  align?: 'left' | 'center';
}

export const MarketingSection: React.FC<MarketingSectionProps> = ({
  title,
  description,
  children,
  className,
  id,
  align = 'left',
}) => (
  <section id={id} className={cn('py-16 sm:py-20', className)}>
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {(title || description) && (
        <div
          className={cn(
            'mb-10 max-w-2xl',
            align === 'center' && 'mx-auto text-center'
          )}
        >
          {title && (
            <h2 className="font-sora text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-3 text-sm leading-relaxed text-neutral-500 sm:text-base">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  </section>
);

export const MarketingCta: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
  variant?: 'light' | 'dark';
}> = ({ title, description, children, variant = 'dark' }) => (
  <section
    className={cn(
      'border-t border-neutral-200 py-16 sm:py-20',
      variant === 'dark'
        ? 'surface-dark text-white'
        : 'bg-white'
    )}
  >
    <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
      {variant === 'dark' && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15),transparent_60%)]" />
      )}
      <div className="relative">
        <h2
          className={cn(
            'font-sora text-2xl font-semibold sm:text-3xl',
            variant === 'dark' ? 'text-white' : 'text-neutral-900'
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            'mx-auto mt-3 max-w-xl text-sm sm:text-base',
            variant === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
          )}
        >
          {description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
      </div>
    </div>
  </section>
);

export const MarketingLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to} className="text-sm font-medium text-brand-600 hover:underline">
    {children}
  </Link>
);
