import React from 'react';
import { Loader2 } from 'lucide-react';
import { MaturityBadge, type ProfileMaturity } from '../MaturityBadge';
import { OnboardingStepShell } from '../OnboardingStepShell';

interface ProfileReviewStepProps {
  niche: string[];
  format: string | null;
  tone: string | null;
  frequency: string | null;
  country: string | null;
  profileMaturity: ProfileMaturity;
  channelName?: string | null;
  isLoading: boolean;
  error?: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

export const ProfileReviewStep: React.FC<ProfileReviewStepProps> = ({
  niche,
  format,
  tone,
  frequency,
  country,
  profileMaturity,
  channelName,
  isLoading,
  error,
  onConfirm,
  onBack,
}) => {
  const isNew = profileMaturity === 'new';

  return (
    <OnboardingStepShell
      title="Review profile"
      description="Confirm how we will personalize your recommendations."
      onBack={onBack}
      onNext={onConfirm}
      nextLabel={isLoading ? 'Saving...' : 'Complete setup'}
      nextDisabled={isLoading}
      isLoading={isLoading}
      cardClassName="space-y-5 text-left"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{channelName || 'Your channel'}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {isNew ? 'Manual profile (new channel)' : 'Analysis-assisted profile'}
          </p>
        </div>
        <MaturityBadge maturity={profileMaturity} />
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
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

      {isNew && (
        <p className="border-t border-neutral-100 pt-4 text-xs leading-relaxed text-neutral-500">
          Trends will use your manual niche and target country until your channel has enough data. You can update
          anytime via Profile → Reconfigure.
        </p>
      )}

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
