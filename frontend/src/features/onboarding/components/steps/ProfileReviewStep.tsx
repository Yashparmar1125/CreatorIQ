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
      cardClassName="space-y-6 text-left"
    >
      {/* Channel Banner & Niches */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
        <div className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] border-[#181719] bg-[#fdfcff] p-4 shadow-[4px_4px_0px_#f0ebff] sm:col-span-7">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
              <Youtube className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-[#14121a]">{channelName || 'Your Channel'}</p>
              <p className="mt-0.5 truncate text-xs text-[#6b6775]">
                {channelHandle ? `${channelHandle} • ` : ''}
                <span className="font-bold text-[#14121a]">
                  {subscriberCount.toLocaleString()}
                </span>{' '}
                subs
              </p>
            </div>
          </div>
          <MaturityBadge maturity={profileMaturity} />
        </div>

        {/* Selected Niches Box */}
        <div className="flex flex-col justify-center rounded-2xl border border-[#ede9f2] bg-[#fbf9fe] p-4 sm:col-span-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#14121a]">
            <Sparkles className="h-3.5 w-3.5 text-[#8b5cf6]" />
            <span>Selected Niches</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {niche.length > 0 ? (
              niche.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-[#8b5cf6]/30 bg-[#f0ebff] px-2.5 py-0.5 text-xs font-bold text-[#6035c0]"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#716c7d]">None selected</span>
            )}
          </div>
        </div>
      </div>

      {/* 4-Column Strategy Summary Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#ede9f2] bg-[#fbf9fe] p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#716c7d]">
            <Film className="h-3.5 w-3.5 text-[#8b5cf6]" />
            <span>Format</span>
          </div>
          <p className="mt-1.5 text-sm font-bold capitalize text-[#14121a]">
            {format?.replace('-', ' ') || '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-[#ede9f2] bg-[#fbf9fe] p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#716c7d]">
            <Calendar className="h-3.5 w-3.5 text-[#8b5cf6]" />
            <span>Cadence</span>
          </div>
          <p className="mt-1.5 text-sm font-bold capitalize text-[#14121a]">
            {frequency?.replace('_', ' ') || '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-[#ede9f2] bg-[#fbf9fe] p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#716c7d]">
            <Mic className="h-3.5 w-3.5 text-[#8b5cf6]" />
            <span>Tone</span>
          </div>
          <p className="mt-1.5 text-sm font-bold text-[#14121a]">{tone || '—'}</p>
        </div>

        <div className="rounded-2xl border border-[#ede9f2] bg-[#fbf9fe] p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#716c7d]">
            <Globe className="h-3.5 w-3.5 text-[#8b5cf6]" />
            <span>Audience</span>
          </div>
          <p className="mt-1.5 truncate text-sm font-bold text-[#14121a]">{country || '—'}</p>
        </div>
      </div>

      {/* Calibration Notice Callout */}
      <div className="rounded-2xl border border-[#a7f3d0]/80 bg-[#e8faf3] p-4 text-xs sm:text-[13px] leading-relaxed text-[#065f46] font-medium flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-[#059669] shrink-0" />
        <span>Your 85-feature LightGBM breakout probability, cosine niche relevance, and expected view ranges will be calibrated to this profile.</span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600">
          {error}
        </div>
      )}
    </OnboardingStepShell>
  );
};
