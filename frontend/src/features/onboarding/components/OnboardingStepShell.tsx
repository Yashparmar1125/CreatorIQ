import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface OnboardingStepShellProps {
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  cardClassName?: string;
  centered?: boolean;
}

export const OnboardingStepShell: React.FC<OnboardingStepShellProps> = ({
  title,
  description,
  badge,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
  isLoading,
  className,
  cardClassName,
  centered = false,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className={cn('w-full', className)}
  >
    <div className="onboarding-card p-6 sm:p-8 md:p-10">
      {/* Card Header */}
      <div className={cn('border-b border-[#f0ebff] pb-5', centered ? 'text-center' : 'text-left')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-cal-sans text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#14121a]">
            {title}
          </h2>
          {badge && (
            <span className="inline-flex items-center rounded-full border border-[#a7f3d0]/80 bg-[#e8faf3] px-3 py-1 text-xs font-bold text-[#059669]">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-[#6b6775]">
            {description}
          </p>
        )}
      </div>

      {/* Card Body */}
      {children && (
        <div className={cn('py-6', cardClassName)}>
          {children}
        </div>
      )}

      {/* Card Footer Action Bar */}
      {(onBack || onNext) && (
        <div className="flex items-center justify-between gap-4 border-t border-[#f0ebff] pt-5">
          <div>
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="onboarding-btn-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || isLoading}
              className="onboarding-btn-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Please wait...</span>
                </>
              ) : (
                <>
                  <span>{nextLabel}</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  </motion.div>
);
