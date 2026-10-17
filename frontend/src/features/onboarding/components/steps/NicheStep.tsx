import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
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
  'Tech',
  'Gaming',
  'Finance',
  'Fitness',
  'Cooking',
  'Vlog',
  'Education',
  'Entertainment',
  'Beauty',
  'Travel',
  'Music',
  'Fashion',
  'Other',
];

export const NicheStep: React.FC<NicheStepProps> = ({
  selectedNiches,
  customNiche,
  detectedNiches = [],
  onToggleNiche,
  onCustomNicheChange,
  onNext,
  onBack,
}) => {
  const isNextDisabled =
    selectedNiches.length === 0 || (selectedNiches.includes('Other') && !customNiche?.trim());

  return (
    <OnboardingStepShell
      badge="Step 2 of 4 • Niches"
      title="Select your content niches"
      description="Choose up to 3 categories. We encode these into Qdrant vector embeddings to match YouTube trends to your channel."
      onBack={onBack}
      onNext={onNext}
      nextLabel="Continue"
      nextDisabled={isNextDisabled}
      cardClassName="space-y-4 text-left"
    >
      {/* Selection Header Bar */}
      <div className="flex items-center justify-between rounded-xl border border-[#222222] bg-[#161616] px-3.5 py-2">
        <span className="text-xs font-medium text-neutral-300">
          Select 1 to 3 primary categories
        </span>
        <span
          className={cn(
            'rounded-md border px-2 py-0.5 font-mono text-xs font-semibold',
            selectedNiches.length > 0
              ? 'border-brand-500/40 bg-brand-500/15 text-brand-300'
              : 'border-[#2a2a2a] bg-[#1c1c1c] text-neutral-400'
          )}
        >
          {selectedNiches.length} / 3 selected
        </span>
      </div>

      {/* Structured 4-Column Niche Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {NICHES.map((n) => {
          const isDetected = detectedNiches.includes(n);
          const isSelected = selectedNiches.includes(n);
          const isMaxReached = selectedNiches.length >= 3 && !isSelected;

          return (
            <button
              key={n}
              type="button"
              disabled={isMaxReached}
              onClick={() => onToggleNiche(n)}
              className={cn(
                'relative flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer',
                isSelected
                  ? 'border-brand-500 bg-brand-950/40 text-white shadow-xs ring-1 ring-brand-500/40'
                  : isMaxReached
                    ? 'border-[#1f1f1f] bg-[#121212] text-neutral-600 opacity-50 cursor-not-allowed'
                    : 'border-[#262626] bg-[#161616] text-neutral-300 hover:border-[#383838] hover:bg-[#1d1d1d] hover:text-white'
              )}
            >
              <span className="truncate">{n}</span>
              {isSelected ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-brand-400" />
              ) : (
                <Plus className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
              )}
              {isDetected && (
                <Badge
                  variant="brand"
                  className="absolute -right-2 -top-2 border border-brand-700/50 bg-brand-950/90 px-1.5 py-0 text-[9px] text-brand-300"
                >
                  Detected
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Niche Input */}
      <AnimatePresence>
        {selectedNiches.includes('Other') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden pt-1"
          >
            <label className="block text-xs font-semibold text-neutral-200">
              Custom Niche Topic <span className="text-red-400">*</span>
            </label>
            <Input
              value={customNiche || ''}
              onChange={(e) => onCustomNicheChange(e.target.value)}
              placeholder="e.g. AI Coding Agents, Sim Racing, Indie Game Dev..."
              className="h-9"
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingStepShell>
  );
};


