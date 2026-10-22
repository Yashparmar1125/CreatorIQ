import React from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
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
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-70"
      animate={{
        scale: [1, 1.08, 1],
        opacity: [0.65, 0.8, 0.65],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        background:
          'radial-gradient(ellipse 55% 60% at 12% 0%, rgba(145,245,211,0.25), transparent 62%), radial-gradient(ellipse 55% 60% at 88% 10%, rgba(255,152,193,0.22), transparent 60%)',
      }}
    />
    <div
      className={cn(
        'relative mx-auto w-full max-w-[1180px] px-8 py-20 sm:py-24',
        visual ? 'grid items-center gap-12 lg:grid-cols-2 lg:gap-16' : '',
        centered && !visual && 'text-center',
      )}
    >
      <div className={cn(centered && !visual && 'mx-auto max-w-3xl')}>
        {badge && (
          <motion.p
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#DED4F2] bg-white/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#4A2E8F] shadow-xs"
          >
            {badgeIcon}
            {badge}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'font-cal-sans text-[2.2rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#171717] sm:text-[2.8rem] lg:text-[3.2rem]',
            centered && !visual && 'mx-auto max-w-[20ch]',
          )}
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'mt-5 max-w-2xl text-base leading-relaxed text-[#625D68] sm:text-lg',
            centered && !visual && 'mx-auto',
          )}
        >
          {description}
        </motion.p>
        {actions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn('mt-8 flex flex-wrap gap-3', centered && !visual && 'justify-center')}
          >
            {actions}
          </motion.div>
        )}
        {footer}
      </div>
      {visual && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {visual}
        </motion.div>
      )}
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  </section>
);

export const MarketingCta: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <section className="bg-[#91F5D3] py-20 overflow-hidden">
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-4xl px-8 text-center"
    >
      <h2 className="font-cal-sans text-[1.8rem] font-bold leading-tight tracking-[-0.02em] text-[#171717] sm:text-[2.2rem]">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#17453A]">
        {description}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
    </motion.div>
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
