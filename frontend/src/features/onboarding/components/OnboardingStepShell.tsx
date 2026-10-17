import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
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
    <Card
      variant="elevated"
      padding="none"
      className="overflow-hidden rounded-2xl border border-[#242424] bg-[#121212] p-5 shadow-2xl shadow-black/70 sm:p-6"
    >
      {/* Card Header */}
      <div className={cn('border-b border-[#1f1f1f] pb-3.5', centered ? 'text-center' : 'text-left')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-sora text-lg font-semibold tracking-tight text-white sm:text-xl">
            {title}
          </h2>
          {badge && (
            <span className="inline-flex items-center rounded-md border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">
            {description}
          </p>
        )}
      </div>

      {/* Card Body */}
      {children && (
        <div className={cn('py-4', cardClassName)}>
          {children}
        </div>
      )}

      {/* Card Footer Action Bar */}
      {(onBack || onNext) && (
        <div className="flex items-center justify-between gap-4 border-t border-[#1f1f1f] pt-3.5">
          <div>
            {onBack ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onBack}
                className="gap-2 border-[#2a2a2a] bg-[#171717] px-4 text-neutral-300 hover:border-[#3a3a3a] hover:bg-[#202020] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            ) : (
              <div />
            )}
          </div>

          {onNext && (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || isLoading}
              size="md"
              className="gap-2 px-5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Please wait...</span>
                </>
              ) : (
                <>
                  <span>{nextLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </Card>
  </motion.div>
);




