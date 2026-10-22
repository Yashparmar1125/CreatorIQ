import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { OnboardingStepShell } from '../OnboardingStepShell';

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
      cardClassName="space-y-5 text-left"
    >
      {/* Selection Header Bar */}
      <div className="flex items-center justify-between rounded-xl border border-[#ede9f2] bg-[#fbf9fe] px-4 py-2.5">
        <span className="text-xs sm:text-[13px] font-semibold text-[#2c2834]">
          Select 1 to 3 primary categories
        </span>
        <span
          className={cn(
            'rounded-full px-3 py-0.5 text-xs font-bold border',
            selectedNiches.length > 0
              ? 'border-[#8b5cf6] bg-[#f0ebff] text-[#7033ea]'
              : 'border-[#dcd7e3] bg-white text-[#716c7a]'
          )}
        >
          {selectedNiches.length} / 3 selected
        </span>
      </div>

      {/* Structured 4-Column Niche Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
                'relative flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-xs sm:text-[13px] font-bold transition-all cursor-pointer',
                isSelected
                  ? 'rounded-xl border-[1.5px] border-[#181719] bg-[#F0EBFF] text-[#14121a] shadow-[3px_3px_0px_#181719]'
                  : isMaxReached
                    ? 'border border-[#ede9f2] bg-neutral-100/60 text-[#a39fa9] opacity-60 cursor-not-allowed'
                    : 'rounded-xl border border-[#DCD7E3] bg-white text-[#2C2834] hover:border-[#181719] hover:bg-[#FAF9FD]'
              )}
            >
              <span className="truncate">{n}</span>
              {isSelected ? (
                <Check className="h-4 w-4 shrink-0 text-[#8b5cf6] stroke-[2.5]" />
              ) : (
                <Plus className="h-4 w-4 shrink-0 text-[#9ca3af]" />
              )}
              {isDetected && (
                <span className="absolute -right-1 -top-1.5 rounded-full border border-[#a7f3d0] bg-[#e8faf3] px-1.5 py-0.5 text-[9px] font-bold text-[#059669]">
                  Detected
                </span>
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
            className="space-y-2 overflow-hidden pt-1"
          >
            <label className="block text-xs sm:text-[13px] font-bold text-[#181719]">
              Custom Niche Topic <span className="text-red-500">*</span>
            </label>
            <input
              value={customNiche || ''}
              onChange={(e) => onCustomNicheChange(e.target.value)}
              placeholder="e.g. AI Coding Agents, Sim Racing, Indie Game Dev..."
              className="h-11 w-full rounded-xl border-[1.5px] border-[#181719] bg-white px-3.5 text-sm text-[#181719] placeholder-[#9B94A5] shadow-[4px_4px_0px_#B197FC] transition-all hover:shadow-[5px_5px_0px_#A78BFA] focus:border-[#181719] focus:outline-none focus:ring-2 focus:ring-[#7C5CD6]/20"
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingStepShell>
  );
};
