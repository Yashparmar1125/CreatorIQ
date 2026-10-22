import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';

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
    <div className="rounded-[28px] border-[1.5px] border-[#181719] bg-white p-8 sm:p-12 text-center shadow-[8px_8px_0px_#70F4B8]">
      <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-[#8b5cf6]/40"
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-[1.5px] border-[#181719] bg-[#f0ebff] shadow-[4px_4px_0px_#70f4b8]">
          <Rocket className="h-7 w-7 text-[#7033ea]" />
        </div>
      </div>

      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#a7f3d0] bg-[#e8faf3] px-3.5 py-1 text-xs font-bold text-[#059669]">
        <CheckCircle2 className="h-4 w-4" />
        <span>Profile & Vector Embedding Calibrated</span>
      </div>

      <h1 className="font-cal-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-[#14121a]">
        You&apos;re all set!
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm sm:text-base leading-relaxed text-[#6b6775]">
        Your personalized trend intelligence feed is ready. Explore your Top 5 breakout opportunities ranked by niche fit, momentum, and view opportunity scoring.
      </p>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onEnter}
          className="inline-flex h-[46px] items-center justify-center gap-2 rounded-full border-[1.5px] border-[#181719] bg-[#FFA2C8] px-8 text-sm font-bold text-[#181719] transition-all hover:-translate-y-0.5 hover:bg-[#FF90BD] hover:shadow-[0_4px_12px_rgba(255,145,190,0.25)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Explore My Top Trends</span>
          <ArrowRight className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  </motion.div>
);
