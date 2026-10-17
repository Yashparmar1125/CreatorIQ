import React from 'react';
import { Check, Loader2, Globe } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { OnboardingStepShell } from '../OnboardingStepShell';

export type PrimaryFormat = 'long-form' | 'shorts' | 'hybrid';

interface PreferencesStepProps {
  format: PrimaryFormat | null;
  frequency: string | null;
  tone: string | null;
  country: string | null;
  isLoading: boolean;
  error?: string | null;
  setFormat: (format: PrimaryFormat) => void;
  setFrequency: (freq: string) => void;
  setTone: (tone: string) => void;
  setCountry: (country: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

const COUNTRIES = [
  { code: 'India', iso: 'IN', label: 'India' },
  { code: 'United States', iso: 'US', label: 'United States' },
  { code: 'United Kingdom', iso: 'GB', label: 'United Kingdom' },
  { code: 'Canada', iso: 'CA', label: 'Canada' },
  { code: 'Australia', iso: 'AU', label: 'Australia' },
  { code: 'Germany', iso: 'DE', label: 'Germany' },
  { code: 'Japan', iso: 'JP', label: 'Japan' },
  { code: 'Brazil', iso: 'BR', label: 'Brazil' },
  { code: 'Global', iso: 'GL', label: 'Global' },
];

const FORMATS: { label: string; desc: string; value: PrimaryFormat }[] = [
  { label: 'Long-form', desc: 'Deep-dive horizontal videos', value: 'long-form' },
  { label: 'Shorts', desc: 'Vertical rapid-fire clips (<60s)', value: 'shorts' },
  { label: 'Hybrid', desc: 'Mix of Shorts & Long-form', value: 'hybrid' },
];

const FREQUENCIES = [
  { label: 'Daily', desc: '5–7 uploads / week', value: 'daily' },
  { label: '3x per Week', desc: 'Consistent growth pace', value: '3x_week' },
  { label: 'Weekly', desc: 'High-production cadence', value: 'weekly' },
];

const TONES = [
  { label: 'Educational', desc: 'Clear, structured & informative' },
  { label: 'Magnetic', desc: 'High-energy & hook-driven' },
  { label: 'Expert', desc: 'Deep technical & authoritative' },
  { label: 'Casual', desc: 'Conversational & relatable' },
];

export const PreferencesStep: React.FC<PreferencesStepProps> = ({
  format,
  frequency,
  tone,
  country,
  isLoading,
  error,
  setFormat,
  setFrequency,
  setTone,
  setCountry,
  onComplete,
  onBack,
}) => {
  const isCompleteDisabled = !format || !tone || !country || !frequency || isLoading;

  return (
    <OnboardingStepShell
      badge="Step 3 of 4 • Strategy"
      title="Content strategy & audience"
      description="Customize your format, cadence, tone, and regional audience so trend velocity matches your style."
      onBack={onBack}
      onNext={onComplete}
      nextDisabled={isCompleteDisabled}
      isLoading={isLoading}
      cardClassName="space-y-4 text-left"
    >
      {/* Row 1: Primary Format & Posting Frequency side-by-side */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 1. Primary Format */}
        <div className="space-y-2 rounded-xl border border-[#202020] bg-[#151515] p-3.5">
          <label className="block text-xs font-semibold text-neutral-200">
            1. Primary Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => {
              const active = format === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border px-2 py-2.5 text-center transition-all cursor-pointer',
                    active
                      ? 'border-brand-500 bg-brand-950/45 text-white ring-1 ring-brand-500/40'
                      : 'border-[#262626] bg-[#181818] text-neutral-300 hover:border-[#383838] hover:text-white'
                  )}
                >
                  <span className="text-xs font-semibold">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Posting Frequency */}
        <div className="space-y-2 rounded-xl border border-[#202020] bg-[#151515] p-3.5">
          <label className="block text-xs font-semibold text-neutral-200">
            2. Posting Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCIES.map((freq) => {
              const active = frequency === freq.value;
              return (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => setFrequency(freq.value)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border px-2 py-2.5 text-center transition-all cursor-pointer',
                    active
                      ? 'border-brand-500 bg-brand-950/45 text-white ring-1 ring-brand-500/40'
                      : 'border-[#262626] bg-[#181818] text-neutral-300 hover:border-[#383838] hover:text-white'
                  )}
                >
                  <span className="text-xs font-semibold">{freq.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Channel Tone & Target Audience Location */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
        {/* 3. Channel Tone (5 cols) */}
        <div className="space-y-2 rounded-xl border border-[#202020] bg-[#151515] p-3.5 sm:col-span-5">
          <label className="block text-xs font-semibold text-neutral-200">
            3. Channel Tone
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((t) => {
              const active = tone === t.label;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setTone(t.label)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all cursor-pointer',
                    active
                      ? 'border-brand-500 bg-brand-950/45 text-white ring-1 ring-brand-500/40'
                      : 'border-[#262626] bg-[#181818] text-neutral-300 hover:border-[#383838] hover:text-white'
                  )}
                >
                  <span className="truncate">{t.label}</span>
                  {active && <Check className="h-3 w-3 shrink-0 text-brand-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Target Audience Geography (7 cols) */}
        <div className="space-y-2 rounded-xl border border-[#202020] bg-[#151515] p-3.5 sm:col-span-7">
          <label className="block text-xs font-semibold text-neutral-200">
            4. Target Audience Location
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {COUNTRIES.map((c) => {
              const active = country === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCountry(c.code)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition-all cursor-pointer',
                    active
                      ? 'border-brand-500 bg-brand-950/45 text-white ring-1 ring-brand-500/40'
                      : 'border-[#262626] bg-[#181818] text-neutral-300 hover:border-[#383838] hover:text-white'
                  )}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Globe className="h-3 w-3 shrink-0 text-neutral-500" />
                    <span className="truncate">{c.label}</span>
                  </span>
                  {active && <Check className="h-3 w-3 shrink-0 text-brand-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
          Saving preferences...
        </div>
      )}
    </OnboardingStepShell>
  );
};


