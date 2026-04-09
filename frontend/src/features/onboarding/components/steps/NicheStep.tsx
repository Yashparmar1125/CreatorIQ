import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface NicheStepProps {
  selectedNiches: string[];
  customNiche?: string;
  detectedNiches?: string[];
  onToggleNiche: (niche: string) => void;
  onCustomNicheChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const NICHES = ['Tech', 'Gaming', 'Finance', 'Fitness', 'Cooking', 'Vlog', 'Education', 'Entertainment', 'Beauty', 'Travel', 'Music', 'Fashion', 'Other'];

export const NicheStep: React.FC<NicheStepProps> = ({
  selectedNiches,
  customNiche,
  detectedNiches = [],
  onToggleNiche,
  onCustomNicheChange,
  onNext,
  onBack
}) => {
  const isNextDisabled = selectedNiches.length === 0 || (selectedNiches.includes('Other') && !customNiche);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-center space-y-8 max-w-2xl mx-auto"
    >
      <div className="space-y-3">
        <h2 className="text-3xl font-bold font-sora text-white tracking-tight">Channel Category</h2>
        <p className="text-neutral-500 font-medium text-sm">Select up to 3 categories that best describe your content.</p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3">
        {NICHES.map((n) => {
          const isDetected = detectedNiches.includes(n);
          const isSelected = selectedNiches.includes(n);
          return (
            <button
              key={n}
              onClick={() => onToggleNiche(n)}
              className={cn(
                "px-6 py-3 rounded-xl border transition-all font-bold text-[11px] uppercase tracking-wider relative",
                isSelected 
                  ? "bg-brand-600 border-brand-600 text-white shadow-lg scale-105" 
                  : "bg-white/5 border-white/5 text-neutral-400 hover:border-white/10 hover:text-white"
              )}
            >
              {n}
              {isDetected && (
                <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-yellow-400 text-neutral-900 text-[7px] font-black rounded-lg border border-neutral-900 shadow-sm animate-pulse">
                  DETECTED
                </div>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedNiches.includes('Other') && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="space-y-2 text-left"
          >
             <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-2">Custom Niche Name</label>
             <input
              type="text"
              value={customNiche || ''}
              onChange={(e) => onCustomNicheChange(e.target.value)}
              placeholder="Enter your unique niche..."
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm outline-none focus:border-brand-600 focus:bg-white/10 transition-all placeholder:text-neutral-700"
             />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex justify-center gap-4 pt-4">
         <button onClick={onBack} className="px-6 py-3 bg-white/5 text-neutral-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all">Back</button>
         <button 
          onClick={onNext} 
          disabled={isNextDisabled}
          className="px-10 py-3 bg-white text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-neutral-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
         >
           Confirm
         </button>
      </div>
    </motion.div>
  );
};
