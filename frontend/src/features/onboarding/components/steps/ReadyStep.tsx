import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ChevronRight } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface ReadyStepProps {
  onEnter: () => void;
}

export const ReadyStep: React.FC<ReadyStepProps> = ({ onEnter }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    className="space-y-8 text-center"
  >
    <div className="relative mx-auto h-36 w-36">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border-2 border-dashed border-brand-500/30"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white to-neutral-100 shadow-2xl">
          <Rocket className="h-10 w-10 text-brand-600" />
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <h1 className="font-sora text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        You&apos;re all set
      </h1>
      <p className="mx-auto max-w-sm text-base leading-relaxed text-neutral-400">
        Your creator profile is ready. Explore your personalized Top 5 trend opportunities.
      </p>
    </div>

    <Button size="lg" onClick={onEnter} className="mx-auto gap-2">
      Explore trends
      <ChevronRight className="h-4 w-4" />
    </Button>
  </motion.div>
);
