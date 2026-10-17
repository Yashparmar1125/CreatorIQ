import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';

interface ReadyStepProps {
  onEnter: () => void;
}

export const ReadyStep: React.FC<ReadyStepProps> = ({ onEnter }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.22 }}
    className="w-full"
  >
    <Card
      variant="elevated"
      padding="none"
      className="overflow-hidden rounded-2xl border border-[#242424] bg-[#121212] p-8 text-center shadow-2xl shadow-black/70 sm:p-10"
    >
      <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-brand-500/35"
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-500/30 bg-[#181826] shadow-xl">
          <Rocket className="h-7 w-7 text-brand-400" />
        </div>
      </div>

      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Profile & Vector Embedding Calibrated</span>
      </div>

      <h1 className="font-sora text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        You&apos;re all set!
      </h1>
      <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-neutral-400">
        Your personalized trend intelligence feed is ready. Explore your Top 5 breakout opportunities ranked by 85-feature LightGBM probability and niche fit.
      </p>

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={onEnter} className="gap-2 px-8">
          <span>Explore My Top Trends</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  </motion.div>
);


