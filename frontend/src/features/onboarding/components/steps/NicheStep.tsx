import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import { OnboardingStepShell } from '../OnboardingStepShell';
import { Input } from '../../../../components/ui/Input';
import { Badge } from '../../../../components/ui/Badge';

interface NicheStepProps {
  selectedNiches: string[];
  customNiche?: string;
  detectedNiches?: string[];
  isNewChannel?: boolean;
  onToggleNiche: (niche: string) => void;
  onCustomNicheChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const NICHES = [
  'Tech', 'Gaming', 'Finance', 'Fitness', 'Cooking', 'Vlog',
  'Education', 'Entertainment', 'Beauty', 'Travel', 'Music', 'Fashion', 'Other',
];

export const NicheStep: React.FC<NicheStepProps> = ({
  selectedNiches,
  customNiche,
  detectedNiches = [],
  isNewChannel = false,
  onToggleNiche,
  onCustomNicheChange,
  onNext,
  onBack,
}) => {
  const isNextDisabled =
    selectedNiches.length === 0 || (selectedNiches.includes('Other') && !customNiche);

  return (
    <OnboardingStepShell
      title="Channel category"
      description={
        isNewChannel
          ? 'Select your niches manually. We will auto-detect from your videos as your channel grows.'
          : 'Select up to 3 categories that best describe your content.'
      }
      onBack={onBack}
      onNext={onNext}
      nextLabel="Confirm"
      nextDisabled={isNextDisabled}
      cardClassName="space-y-5"
    >
      <div className="flex flex-wrap justify-center gap-2">
        {NICHES.map((n) => {
          const isDetected = !isNewChannel && detectedNiches.includes(n);
          const isSelected = selectedNiches.includes(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onToggleNiche(n)}
              className={cn(
                'relative rounded-xl border px-4 py-2.5 text-xs font-medium transition-all',
                isSelected
                  ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/25'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-200 hover:bg-brand-50/50'
              )}
            >
              {n}
              {isDetected && (
                <Badge variant="brand" className="absolute -right-2 -top-2 px-1.5 py-0 text-[9px]">
                  Detected
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedNiches.includes('Other') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            <label className="text-xs font-medium text-neutral-600">Custom niche</label>
            <Input
              value={customNiche || ''}
              onChange={(e) => onCustomNicheChange(e.target.value)}
              placeholder="Enter your unique niche..."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingStepShell>
  );
};
