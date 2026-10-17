import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, TrendingUp, Cpu, Compass } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';

interface WelcomeStepProps {
  onNext: () => void;
}

const HIGHLIGHTS = [
  {
    icon: Compass,
    title: 'Vector Niche Match',
    desc: '384-dim Qdrant embeddings match YouTube concepts to your niche & region.',
  },
  {
    icon: Cpu,
    title: 'LightGBM Virality',
    desc: '85-feature model forecasts 7-day breakout probability & trajectory.',
  },
  {
    icon: TrendingUp,
    title: 'Strategy Co-Pilot',
    desc: 'Generates tailored video hooks, titles, and angles for top trends.',
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
    <Card
      variant="elevated"
      padding="none"
      className="overflow-hidden rounded-2xl border border-[#242424] bg-[#121212] p-6 shadow-2xl shadow-black/70 sm:p-8"
    >
      {/* Top Hero Header */}
      <div className="flex items-center gap-4 border-b border-[#1f1f1f] pb-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-500/30 bg-[#181826] shadow-md">
          <Sparkles className="h-6 w-6 text-brand-400" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-sora text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Welcome to <span className="text-brand-400">CreatorIQ</span>
            </h1>
            <span className="inline-flex items-center rounded-md border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-400">
              2 Min Setup
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-400 sm:text-sm">
            Configure your channel profile to calibrate trend velocity and view forecasts for your audience.
          </p>
        </div>
      </div>

      {/* 3-Column Feature Grid */}
      <div className="grid grid-cols-1 gap-3.5 py-5 sm:grid-cols-3">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex flex-col justify-between rounded-xl border border-[#222222] bg-[#161616] p-4 text-left transition-colors hover:border-[#2e2e2e]"
            >
              <div>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10 text-brand-400">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-400">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col items-stretch justify-between gap-3 border-t border-[#1f1f1f] pt-4 sm:flex-row sm:items-center">
        <p className="text-xs text-neutral-500">
          No YouTube OAuth required — update anytime in Settings.
        </p>
        <Button size="lg" onClick={onNext} className="gap-2 px-6">
          <span>Start Profile Setup</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  </motion.div>
);



