import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.02 }}
    className="space-y-8 text-center"
  >
    <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
      <div className="absolute inset-0 rounded-2xl bg-brand-600/20 blur-xl" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white to-neutral-100 shadow-2xl">
        <Sparkles className="h-9 w-9 text-brand-600" />
      </div>
    </div>

    <div className="space-y-4">
      <h1 className="font-sora text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Welcome to <span className="text-gradient-brand">CreatorIQ</span>
      </h1>
      <p className="mx-auto max-w-md text-base leading-relaxed text-neutral-400">
        Connect your YouTube channel and get a personalized trend feed in minutes.
      </p>
    </div>

    <Button size="lg" onClick={onNext} className="mx-auto gap-2">
      Get started
      <ChevronRight className="h-4 w-4" />
    </Button>
  </motion.div>
);
