import React from 'react';
import { Check, Loader2, Globe, Film, Calendar, Sparkles } from 'lucide-react';
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
      description="Customize your format, cadence, tone, and regional audience so trend recommendations match your production style."
      onBack={onBack}
      onNext={onComplete}
      nextDisabled={isCompleteDisabled}
      isLoading={isLoading}
      cardClassName="space-y-6 text-left"
    >
      {/* Row 1: Primary Format & Posting Frequency */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* 1. Primary Format */}
        <div className="space-y-2.5 rounded-2xl border border-[#ede9f2] bg-[#fbf9fe] p-4">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-[#8b5cf6]" />
            <label className="block text-xs sm:text-[13px] font-bold text-[#14121a]">
              1. Primary Format
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => {
              const active = format === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all cursor-pointer',
                    active
                      ? 'rounded-xl border-[1.5px] border-[#181719] bg-[#F0EBFF] text-[#14121a] shadow-[3px_3px_0px_#181719]'
                      : 'rounded-xl border border-[#DCD7E3] bg-white text-[#2C2834] hover:border-[#181719] hover:bg-[#FAF9FD]'
                  )}
                >
                  <span className="text-xs font-bold text-[#14121a]">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Posting Frequency */}
        <div className="space-y-2.5 rounded-2xl border border-[#ede9f2] bg-[#fbf9fe] p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#8b5cf6]" />
            <label className="block text-xs sm:text-[13px] font-bold text-[#14121a]">
              2. Upload Cadence
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCIES.map((freq) => {
              const active = frequency === freq.value;
              return (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => setFrequency(freq.value)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all cursor-pointer',
                    active
                      ? 'rounded-xl border-[1.5px] border-[#181719] bg-[#F0EBFF] text-[#14121a] shadow-[3px_3px_0px_#181719]'
                      : 'rounded-xl border border-[#DCD7E3] bg-white text-[#2C2834] hover:border-[#181719] hover:bg-[#FAF9FD]'
                  )}
                >
                  <span className="text-xs font-bold text-[#14121a]">{freq.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Channel Tone & Target Audience Location */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-12">
        {/* 3. Channel Tone */}
        <div className="space-y-2.5 rounded-2xl border border-[#ede9f2] bg-[#fbf9fe] p-4 sm:col-span-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
            <label className="block text-xs sm:text-[13px] font-bold text-[#14121a]">
              3. Channel Tone
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((t) => {
              const active = tone === t.label;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setTone(t.label)}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all cursor-pointer',
                    active
                      ? 'rounded-xl border-[1.5px] border-[#181719] bg-[#F0EBFF] text-[#14121a] shadow-[3px_3px_0px_#181719]'
                      : 'rounded-xl border border-[#DCD7E3] bg-white text-[#2C2834] hover:border-[#181719] hover:bg-[#FAF9FD]'
                  )}
                >
                  <span className="truncate">{t.label}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#8b5cf6] stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Target Audience Location */}
        <div className="space-y-2.5 rounded-2xl border border-[#ede9f2] bg-[#fbf9fe] p-4 sm:col-span-7">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#8b5cf6]" />
            <label className="block text-xs sm:text-[13px] font-bold text-[#14121a]">
              4. Target Audience Location
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {COUNTRIES.map((c) => {
              const active = country === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCountry(c.code)}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-2.5 py-2.5 text-left text-xs font-bold transition-all cursor-pointer',
                    active
                      ? 'rounded-xl border-[1.5px] border-[#181719] bg-[#F0EBFF] text-[#14121a] shadow-[3px_3px_0px_#181719]'
                      : 'rounded-xl border border-[#DCD7E3] bg-white text-[#2C2834] hover:border-[#181719] hover:bg-[#FAF9FD]'
                  )}
                >
                  <span className="truncate">{c.label}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#8b5cf6] stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-[#6b6775]">
          <Loader2 className="h-4 w-4 animate-spin text-[#8b5cf6]" />
          Saving preferences...
        </div>
      )}
    </OnboardingStepShell>
  );
};
