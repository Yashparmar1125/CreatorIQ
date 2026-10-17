import React from 'react';
import { Youtube, Sparkles, Globe, Film, Mic, Calendar } from 'lucide-react';
import { MaturityBadge, type ProfileMaturity } from '../MaturityBadge';
import { OnboardingStepShell } from '../OnboardingStepShell';

interface ProfileReviewStepProps {
  channelName: string;
  channelHandle?: string | null;
  subscriberCount?: number;
  niche: string[];
  format: string | null;
  tone: string | null;
  frequency: string | null;
  country: string | null;
  profileMaturity: ProfileMaturity;
  isLoading: boolean;
  error?: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

export const ProfileReviewStep: React.FC<ProfileReviewStepProps> = ({
  channelName,
  channelHandle,
  subscriberCount = 0,
  niche,
  format,
  tone,
  frequency,
  country,
  profileMaturity,
  isLoading,
  error,
  onConfirm,
  onBack,
}) => {
  return (
    <OnboardingStepShell
      badge="Step 4 of 4 • Review"
      title="Review your creator profile"
      description="Verify your channel configuration before we generate your Qdrant vector embedding and rank your Top 5 trends."
      onBack={onBack}
      onNext={onConfirm}
      nextLabel={isLoading ? 'Calibrating Engine...' : 'Complete Setup'}
      nextDisabled={isLoading}
      isLoading={isLoading}
      cardClassName="space-y-4 text-left"
    >
      {/* Channel Banner & Niches in a 2-column row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#262626] bg-[#161616] p-3.5 sm:col-span-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-sm">
              <Youtube className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{channelName || 'Your Channel'}</p>
              <p className="mt-0.5 truncate text-xs text-neutral-400">
                {channelHandle ? `${channelHandle} • ` : ''}
                <span className="font-mono font-medium text-neutral-200">
                  {subscriberCount.toLocaleString()}
                </span>{' '}
                subs
              </p>
            </div>
          </div>
          <MaturityBadge maturity={profileMaturity} />
        </div>

        {/* Selected Niches Box */}
        <div className="flex flex-col justify-center rounded-xl border border-[#222222] bg-[#151515] p-3.5 sm:col-span-5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>Selected Niches</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {niche.length > 0 ? (
              niche.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-md border border-brand-500/30 bg-brand-950/40 px-2 py-0.5 text-xs font-semibold text-brand-300"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-xs text-neutral-500">None selected</span>
            )}
          </div>
        </div>
      </div>

      {/* 4-Column Strategy Summary Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#222222] bg-[#151515] p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
            <Film className="h-3.5 w-3.5 text-neutral-500" />
            <span>Format</span>
          </div>
          <p className="mt-1 text-xs font-semibold capitalize text-white sm:text-sm">
            {format?.replace('-', ' ') || '—'}
          </p>
        </div>

        <div className="rounded-xl border border-[#222222] bg-[#151515] p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
            <Calendar className="h-3.5 w-3.5 text-neutral-500" />
            <span>Cadence</span>
          </div>
          <p className="mt-1 text-xs font-semibold capitalize text-white sm:text-sm">
            {frequency?.replace('_', ' ') || '—'}
          </p>
        </div>

        <div className="rounded-xl border border-[#222222] bg-[#151515] p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
            <Mic className="h-3.5 w-3.5 text-neutral-500" />
            <span>Tone</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-white sm:text-sm">{tone || '—'}</p>
        </div>

        <div className="rounded-xl border border-[#222222] bg-[#151515] p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
            <Globe className="h-3.5 w-3.5 text-neutral-500" />
            <span>Audience</span>
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-white sm:text-sm">{country || '—'}</p>
        </div>
      </div>

      {/* Info Callout */}
      <div className="rounded-xl border border-[#222222] bg-[#141414] px-3.5 py-2.5 text-xs leading-relaxed text-neutral-400">
        Your 85-feature LightGBM breakout probability, cosine niche relevance, and expected view ranges will be calibrated to this profile.
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-400">
          {error}
        </div>
      )}
    </OnboardingStepShell>
  );
};


