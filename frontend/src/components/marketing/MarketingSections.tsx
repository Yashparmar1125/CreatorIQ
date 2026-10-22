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
      'relative overflow-hidden border-b border-[#EFEAF2] bg-[#FBF8FF]',
      className,
    )}
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-70"
      style={{
        background:
          'radial-gradient(ellipse 55% 60% at 12% 0%, rgba(145,245,211,0.22), transparent 62%), radial-gradient(ellipse 55% 60% at 88% 10%, rgba(255,152,193,0.18), transparent 60%)',
      }}
    />
    <div
      className={cn(
        'relative mx-auto w-full max-w-[1180px] px-8 py-24',
        visual ? 'grid items-center gap-12 lg:grid-cols-2 lg:gap-16' : '',
        centered && !visual && 'text-center',
      )}
    >
      <div className={cn(centered && !visual && 'mx-auto max-w-3xl')}>
        {badge && (
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#DED4F2] bg-white/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#4A2E8F]">
            {badgeIcon}
            {badge}
          </p>
        )}
        <h1
          className={cn(
            'font-cal-sans text-[2.1rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#171717] sm:text-[2.7rem] lg:text-[3.1rem]',
            centered && !visual && 'mx-auto max-w-[20ch]',
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            'mt-5 max-w-2xl text-base leading-relaxed text-[#625D68] sm:text-lg',
            centered && !visual && 'mx-auto',
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
  <section id={id} className={cn('bg-[#FBFAF8] py-20', className)}>
    <div className="mx-auto w-full max-w-[1180px] px-8">
      {(title || description) && (
        <div
          className={cn('mb-12 max-w-2xl', align === 'center' && 'mx-auto text-center')}
        >
          {title && (
            <h2 className="font-cal-sans text-[1.8rem] font-bold leading-tight tracking-[-0.025em] text-[#171717] sm:text-[2.1rem]">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-3 text-base leading-relaxed text-[#625D68]">{description}</p>
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
}> = ({ title, description, children }) => (
  <section className="bg-[#91F5D3] py-20">
    <div className="mx-auto w-full max-w-4xl px-8 text-center">
      <h2 className="font-cal-sans text-[1.8rem] font-bold leading-tight tracking-[-0.02em] text-[#171717] sm:text-[2.2rem]">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#17453A]">
        {description}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  </section>
);

export const MarketingLink: React.FC<{ to: string; children: React.ReactNode }> = ({
  to,
  children,
}) => (
  <Link to={to} className="text-sm font-semibold text-[#4A2E8F] hover:underline">
    {children}
  </Link>
);
