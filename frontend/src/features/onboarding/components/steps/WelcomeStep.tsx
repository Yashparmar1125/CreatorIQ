import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="text-center space-y-8"
    >
      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-neutral-100 relative group">
         <Sparkles className="w-10 h-10 text-brand-600 relative z-10" />
      </div>
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold font-sora tracking-tight text-white leading-tight">
          Welcome to <span className="text-brand-400">CreatorIQ</span>
        </h1>
        <p className="text-neutral-500 text-lg font-medium max-w-md mx-auto leading-relaxed">
          Connect your YouTube account to start optimizing your content with AI.
        </p>
      </div>
      <button 
        onClick={onNext}
        className="px-10 py-4 bg-white text-neutral-900 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-neutral-100 transition-all shadow-lg flex items-center gap-3 mx-auto group active:scale-95"
      >
        Get Started
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </motion.div>
  );
};
