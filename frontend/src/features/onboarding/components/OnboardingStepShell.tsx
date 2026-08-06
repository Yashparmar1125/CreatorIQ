import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';

interface OnboardingStepShellProps {
  title: string;
  description?: string;
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
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className={cn('mx-auto w-full max-w-xl space-y-6', className)}
  >
    <div className={cn('space-y-2', centered ? 'text-center' : 'text-center')}>
      <h2 className="font-sora text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="text-sm leading-relaxed text-neutral-400">{description}</p>
      )}
    </div>

    {children && (
      <Card variant="elevated" className={cn('shadow-xl shadow-black/20', cardClassName)}>
        {children}
      </Card>
    )}

    {(onBack || onNext) && (
      <div className="flex items-center justify-center gap-3 pt-2">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="text-neutral-400 hover:bg-white/10 hover:text-white">
            Back
          </Button>
        )}
        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled || isLoading} size="lg">
            {isLoading ? 'Please wait...' : nextLabel}
          </Button>
        )}
      </div>
    )}
  </motion.div>
);
