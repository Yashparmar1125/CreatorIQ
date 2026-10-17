import React, { useState } from 'react';
import { Youtube, Users, AtSign, Tv, Check } from 'lucide-react';
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
  { label: '< 1K', sub: 'Starter', value: 500, tier: 'Small' },
  { label: '1K – 10K', sub: 'Emerging', value: 5000, tier: 'Small' },
  { label: '10K – 100K', sub: 'Growing', value: 50000, tier: 'Medium' },
  { label: '100K – 1M', sub: 'Established', value: 250000, tier: 'Big' },
  { label: '1M+', sub: 'Authority', value: 1000000, tier: 'Big' },
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
      badge="Step 1 of 4 • Channel"
      title="Tell us about your channel"
      description="Enter your channel details to calibrate baseline audience reach and channel tier weighting."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!isValid}
      cardClassName="space-y-4 text-left"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Channel Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-200">
            Channel Name <span className="text-red-400">*</span>
          </label>
          <Input
            value={channelName}
            onChange={(e) => onChannelNameChange(e.target.value)}
            placeholder="e.g. Tech With Alex"
            icon={<Tv className="h-4 w-4 text-neutral-400" />}
            className="h-10"
            autoFocus
          />
        </div>

        {/* Channel Handle */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-200">
            YouTube Handle <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <Input
            value={channelHandle}
            onChange={(e) => {
              const raw = e.target.value.trim();
              const val = raw.startsWith('@') ? raw : `@${raw}`;
              onChannelHandleChange(raw ? val : '');
            }}
            placeholder="@techwithalex"
            icon={<AtSign className="h-4 w-4 text-neutral-400" />}
            className="h-10"
          />
        </div>
      </div>

      {/* Subscriber Tier Selection (5-Column Single Row) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-neutral-200">
            Subscriber Audience Size
          </label>
          <button
            type="button"
            onClick={() => setUseExactCount(!useExactCount)}
            className="text-xs font-medium text-brand-400 transition-colors hover:text-brand-300 cursor-pointer"
          >
            {useExactCount ? 'Choose from tiers' : 'Enter exact count'}
          </button>
        </div>

        {!useExactCount ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {SUBSCRIBER_TIERS.map((tier) => {
              const isSelected = selectedTier?.value === tier.value;
              return (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => onSubscriberCountChange(tier.value)}
                  className={cn(
                    'flex flex-col justify-between rounded-xl border p-3 text-left transition-all cursor-pointer',
                    isSelected
                      ? 'border-brand-500 bg-brand-950/40 text-white ring-1 ring-brand-500/40'
                      : 'border-[#262626] bg-[#161616] text-neutral-300 hover:border-[#383838] hover:bg-[#1c1c1c]'
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-white">{tier.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-brand-400" />}
                  </div>
                  <span className="mt-1.5 text-[10px] text-neutral-400">
                    {tier.sub} · {tier.tier}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="max-w-xs">
            <Input
              type="number"
              value={subscriberCount || ''}
              onChange={(e) => onSubscriberCountChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="e.g. 15400"
              icon={<Users className="h-4 w-4 text-neutral-400" />}
              className="h-10"
            />
          </div>
        )}
      </div>

      {/* Compact Live Channel Preview Card */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#242424] bg-[#151515] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-700 text-white">
            <Youtube className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white sm:text-sm">
              {channelName.trim() || 'Your Channel Name'}
            </p>
            <p className="truncate text-[11px] text-neutral-400">
              {channelHandle ||
                (channelName.trim()
                  ? `@${channelName.toLowerCase().replace(/\s+/g, '')}`
                  : '@channelhandle')}{' '}
              •{' '}
              <span className="font-mono font-medium text-neutral-200">
                {(subscriberCount || 0).toLocaleString()}
              </span>{' '}
              subscribers
            </p>
          </div>
        </div>
        <span className="hidden shrink-0 rounded border border-[#2a2a2a] bg-[#1c1c1c] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 sm:inline-block">
          Preview
        </span>
      </div>
    </OnboardingStepShell>
  );
};
