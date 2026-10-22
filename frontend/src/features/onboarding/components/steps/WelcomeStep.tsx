import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, TrendingUp, Cpu, Compass } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const HIGHLIGHTS = [
  {
    icon: Compass,
    title: 'Vector Niche Match',
    desc: '384-dim Qdrant embeddings match YouTube trends specifically to your audience & region.',
  },
  {
    icon: Cpu,
    title: 'LightGBM Virality',
    desc: '85-feature model forecasts breakout probability, momentum, and search trajectory.',
  },
  {
    icon: TrendingUp,
    title: 'Strategy Co-Pilot',
    desc: 'Instantly generates high-retention video hooks, titles, and angles for top breakout topics.',
  },
];

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
    className="w-full"
  >
    <div className="onboarding-card p-6 sm:p-9 md:p-11">
      {/* Top Hero Header */}
      <div className="flex items-start sm:items-center gap-4 border-b border-[#f0ebff] pb-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-[#181719] bg-[#f0ebff] shadow-[4px_4px_0px_#70f4b8]">
          <Sparkles className="h-7 w-7 text-[#7033ea]" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-sora text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14121a]">
              Welcome to <span className="text-[#8b5cf6]">CreatorIQ</span>
            </h1>
            <span className="inline-flex items-center rounded-full border border-[#a7f3d0]/80 bg-[#e8faf3] px-3 py-1 text-xs font-bold text-[#059669]">
              2 Min Setup
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#6b6775]">
            Configure your channel profile to calibrate trend momentum and view opportunity forecasts for your unique audience.
          </p>
        </div>
      </div>

      {/* 3-Column Feature Grid */}
      <div className="grid grid-cols-1 gap-4 py-7 sm:grid-cols-3">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex flex-col justify-between rounded-2xl border-[1.5px] border-[#181719] bg-[#fcfaff] p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#f0ebff]"
            >
              <div>
                <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8cbf9] bg-[#f0ebff] text-[#7033ea]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#14121a] font-sora">{item.title}</h3>
                <p className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-[#6b6775]">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col items-stretch justify-between gap-4 border-t border-[#f0ebff] pt-6 sm:flex-row sm:items-center">
        <p className="text-xs text-[#716c7d]">
          No YouTube OAuth required — update or connect channels anytime in Settings.
        </p>
        <button
          type="button"
          onClick={onNext}
          className="onboarding-btn-primary"
        >
          <span>Start Profile Setup</span>
          <ArrowRight className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  </motion.div>
);
