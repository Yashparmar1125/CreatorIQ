import React from 'react';
import { Loader2 } from 'lucide-react';
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
      title="Review profile"
      description="Confirm your channel settings before creating your personalized workspace."
      onBack={onBack}
      onNext={onConfirm}
      nextLabel={isLoading ? 'Saving...' : 'Complete setup'}
      nextDisabled={isLoading}
      isLoading={isLoading}
      cardClassName="space-y-5 text-left"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-neutral-900">{channelName || 'Your channel'}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {channelHandle ? `${channelHandle} • ` : ''}
            {subscriberCount.toLocaleString()} subscribers
          </p>
        </div>
        <MaturityBadge maturity={profileMaturity} />
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm border-t border-neutral-100 pt-4">
        <div>
          <dt className="text-xs text-neutral-500">Niches</dt>
          <dd className="mt-1 font-medium text-neutral-900">{niche.join(', ') || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Format</dt>
          <dd className="mt-1 font-medium capitalize text-neutral-900">{format?.replace('-', ' ') || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Tone</dt>
          <dd className="mt-1 font-medium text-neutral-900">{tone || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Frequency</dt>
          <dd className="mt-1 font-medium text-neutral-900">{frequency?.replace('_', ' ') || '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-neutral-500">Target audience</dt>
          <dd className="mt-1 font-medium text-neutral-900">{country || '—'}</dd>
        </div>
      </dl>

      <p className="border-t border-neutral-100 pt-3 text-xs leading-relaxed text-neutral-500">
        AI recommendations, opportunity scoring, and view estimates will be calibrated to your channel profile. You can update these anytime in Settings.
      </p>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving your profile...
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </OnboardingStepShell>
  );
};
