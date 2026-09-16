import React, { useState } from 'react';
import { Youtube, Users, AtSign, Tv } from 'lucide-react';
import { OnboardingStepShell } from '../OnboardingStepShell';
import { Input } from '../../../../components/ui/Input';
import { cn } from '../../../../lib/utils';

interface ManualChannelStepProps {
  channelName: string;
  channelHandle: string;
  subscriberCount: number;
  onChannelNameChange: (name: string) => void;
  onChannelHandleChange: (handle: string) => void;
  onSubscriberCountChange: (count: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const SUBSCRIBER_TIERS = [
  { label: 'Just Starting (<1K)', value: 500, tier: 'small' },
  { label: '1K - 10K', value: 5000, tier: 'small' },
  { label: '10K - 100K', value: 50000, tier: 'medium' },
  { label: '100K - 1M', value: 250000, tier: 'big' },
  { label: '1M+', value: 1000000, tier: 'big' },
];

export const ManualChannelStep: React.FC<ManualChannelStepProps> = ({
  channelName,
  channelHandle,
  subscriberCount,
  onChannelNameChange,
  onChannelHandleChange,
  onSubscriberCountChange,
  onNext,
  onBack,
}) => {
  const [useExactCount, setUseExactCount] = useState(false);

  const selectedTier = SUBSCRIBER_TIERS.find((t) => t.value === subscriberCount);
  const isValid = channelName.trim().length > 0;

  return (
    <OnboardingStepShell
      title="Channel details"
      description="Enter your channel information to calibrate AI trend relevance and view estimations."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!isValid}
      cardClassName="space-y-6 text-left"
    >
      <div className="space-y-4">
        {/* Channel Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700">
            Channel name <span className="text-red-500">*</span>
          </label>
          <Input
            value={channelName}
            onChange={(e) => onChannelNameChange(e.target.value)}
            placeholder="e.g. Tech With Alex"
            icon={<Tv className="h-4 w-4 text-neutral-400" />}
            autoFocus
          />
        </div>

        {/* Channel Handle */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700">
            Channel handle <span className="text-xs font-normal text-neutral-400">(optional)</span>
          </label>
          <Input
            value={channelHandle}
            onChange={(e) => {
              const val = e.target.value.startsWith('@') ? e.target.value : `@${e.target.value}`;
              onChannelHandleChange(e.target.value ? val : '');
            }}
            placeholder="@techwithalex"
            icon={<AtSign className="h-4 w-4 text-neutral-400" />}
          />
        </div>

        {/* Subscriber Tier Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-700">Subscriber audience</label>
            <button
              type="button"
              onClick={() => setUseExactCount(!useExactCount)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              {useExactCount ? 'Choose from tiers' : 'Enter exact count'}
            </button>
          </div>

          {!useExactCount ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUBSCRIBER_TIERS.map((tier) => {
                const isSelected = selectedTier?.value === tier.value;
                return (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => onSubscriberCountChange(tier.value)}
                    className={cn(
                      'rounded-xl border p-2.5 text-left text-xs font-medium transition-all',
                      isSelected
                        ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-200 hover:bg-brand-50/30'
                    )}
                  >
                    <div className="font-semibold text-neutral-900">{tier.label}</div>
                    <div className="text-[10px] text-neutral-400 capitalize mt-0.5">{tier.tier} tier</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <Input
              type="number"
              value={subscriberCount || ''}
              onChange={(e) => onSubscriberCountChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="e.g. 15400"
              icon={<Users className="h-4 w-4 text-neutral-400" />}
            />
          )}
        </div>
      </div>

      {/* Live Channel Preview Card */}
      {channelName.trim() && (
        <div className="flex items-center gap-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-sm shadow-red-600/20">
            <Youtube className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900">{channelName}</p>
            <p className="truncate text-xs text-neutral-500">
              {channelHandle || `@${channelName.toLowerCase().replace(/\s+/g, '')}`} •{' '}
              <span className="font-medium text-neutral-700">
                {subscriberCount ? subscriberCount.toLocaleString() : '0'} subscribers
              </span>
            </p>
          </div>
        </div>
      )}
    </OnboardingStepShell>
  );
};