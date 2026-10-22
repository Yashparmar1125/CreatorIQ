import { Youtube, Users, Check } from 'lucide-react';
import { OnboardingStepShell } from '../OnboardingStepShell';
import { cn } from '../../../../lib/utils';
import { useState } from 'react';

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
      cardClassName="space-y-6 text-left"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Channel Name */}
        <div className="space-y-2">
          <label className="block text-xs sm:text-[13px] font-bold text-[#181719]">
            Channel Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            {/* <Tv className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#716c7a]" /> */}
            <input
              value={channelName}
              onChange={(e) => onChannelNameChange(e.target.value)}
              placeholder="e.g. Tech With Alex"
              className="onboarding-input pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Channel Handle */}
        <div className="space-y-2">
          <label className="block text-xs sm:text-[13px] font-bold text-[#181719]">
            YouTube Handle <span className="font-normal text-[#716c7a]">(optional)</span>
          </label>
          <div className="relative">
            {/* <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#716c7a]" /> */}
            <input
              value={channelHandle}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const val = raw.startsWith('@') ? raw : `@${raw}`;
                onChannelHandleChange(raw ? val : '');
              }}
              placeholder="@techwithalex"
              className="onboarding-input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Subscriber Tier Selection */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs sm:text-[13px] font-bold text-[#181719]">
            Subscriber Audience Size
          </label>
          <button
            type="button"
            onClick={() => setUseExactCount(!useExactCount)}
            className="text-xs font-semibold text-[#8b5cf6] hover:text-[#7033ea] transition-colors cursor-pointer"
          >
            {useExactCount ? 'Choose from tiers' : 'Enter exact count'}
          </button>
        </div>

        {!useExactCount ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {SUBSCRIBER_TIERS.map((tier) => {
              const isSelected = selectedTier?.value === tier.value;
              return (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => onSubscriberCountChange(tier.value)}
                  className={cn(
                    'flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer',
                    isSelected
                      ? 'onboarding-tile-active'
                      : 'onboarding-tile'
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-[13px] font-bold text-[#14121a]">{tier.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-[#8b5cf6] stroke-[2.5]" />}
                  </div>
                  <span className="mt-1 text-[11px] text-[#6b6775]">
                    {tier.sub} · {tier.tier}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="max-w-xs relative">
            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#716c7a]" />
            <input
              type="number"
              value={subscriberCount || ''}
              onChange={(e) => onSubscriberCountChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="e.g. 15400"
              className="onboarding-input pl-10"
            />
          </div>
        )}
      </div>

      {/* Live Channel Preview Card */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border-[1.5px] border-[#181719] bg-[#fdfcff] p-4 shadow-[4px_4px_0px_#f0ebff]">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
            <Youtube className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm sm:text-base font-bold text-[#14121a]">
              {channelName.trim() || 'Your Channel Name'}
            </p>
            <p className="truncate text-xs sm:text-[12.5px] text-[#6b6775]">
              {channelHandle ||
                (channelName.trim()
                  ? `@${channelName.toLowerCase().replace(/\s+/g, '')}`
                  : '@channelhandle')}{' '}
              •{' '}
              <span className="font-bold text-[#14121a]">
                {(subscriberCount || 0).toLocaleString()}
              </span>{' '}
              subscribers
            </p>
          </div>
        </div>
        <span className="hidden shrink-0 rounded-full border border-[#a7f3d0] bg-[#e8faf3] px-3 py-1 text-xs font-bold text-[#059669] sm:inline-block">
          Live Preview
        </span>
      </div>
    </OnboardingStepShell>
  );
};