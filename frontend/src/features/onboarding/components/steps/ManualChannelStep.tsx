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
          <label className="text-xs font-semibold text-neutral-300">
            Channel name <span className="text-red-400">*</span>
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
          <label className="text-xs font-semibold text-neutral-300">
            Channel handle <span className="text-xs font-normal text-neutral-500">(optional)</span>
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
            <label className="text-xs font-semibold text-neutral-300">Subscriber audience</label>
            <button
              type="button"
              onClick={() => setUseExactCount(!useExactCount)}
              className="text-xs font-medium text-brand-400 hover:text-brand-300"
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
                      'rounded-xl border p-2.5 text-left text-xs font-medium transition-all cursor-pointer',
                      isSelected
                        ? 'border-brand-500 bg-brand-600/20 text-brand-300 ring-2 ring-brand-500/30 shadow-sm'
                        : 'border-[#262626] bg-[#161616] text-neutral-300 hover:border-[#383838] hover:bg-[#1e1e1e]'
                    )}
                  >
                    <div className={cn('font-semibold', isSelected ? 'text-white' : 'text-neutral-200')}>
                      {tier.label}
                    </div>
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
        <div className="flex items-center gap-3.5 rounded-xl border border-[#262626] bg-[#141414] p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-sm shadow-red-600/20">
            <Youtube className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{channelName}</p>
            <p className="truncate text-xs text-neutral-400">
              {channelHandle || `@${channelName.toLowerCase().replace(/\s+/g, '')}`} •{' '}
              <span className="font-medium text-neutral-300">
                {subscriberCount ? subscriberCount.toLocaleString() : '0'} subscribers
              </span>
            </p>
          </div>
        </div>
      )}
    </OnboardingStepShell>
  );
};