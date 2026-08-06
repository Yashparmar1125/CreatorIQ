import React from 'react';
import { Check, Loader2 } from 'lucide-react';
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
  'United States', 'United Kingdom', 'Canada', 'Australia', 'India',
  'Brazil', 'Japan', 'Germany', 'France', 'Spain', 'Mexico', 'South Korea', 'Italy',
];

const FORMATS: { label: string; value: PrimaryFormat }[] = [
  { label: 'Long-form', value: 'long-form' },
  { label: 'Shorts', value: 'shorts' },
  { label: 'Hybrid', value: 'hybrid' },
];

const TONES = ['Educational', 'Magnetic', 'Expert', 'Casual'];

const chipClass = (active: boolean) =>
  cn(
    'rounded-xl border px-3 py-2.5 text-xs font-medium transition-all',
    active
      ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/20'
      : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-200 hover:bg-brand-50/40'
  );

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
      title="Channel strategy"
      description="Help us tailor recommendations to your style and audience."
      onBack={onBack}
      onNext={onComplete}
      nextDisabled={isCompleteDisabled}
      isLoading={isLoading}
      cardClassName="space-y-6 text-left"
    >
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-600">Primary format</label>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map((f) => (
            <button key={f.value} type="button" onClick={() => setFormat(f.value)} className={chipClass(format === f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-600">Posting frequency</label>
        <select
          className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10"
          value={frequency || ''}
          onChange={(e) => setFrequency(e.target.value)}
        >
          <option value="">Select frequency...</option>
          <option value="daily">Daily</option>
          <option value="3x_week">3x per week</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-600">Channel tone</label>
        <div className="grid grid-cols-2 gap-2">
          {TONES.map((t) => (
            <button key={t} type="button" onClick={() => setTone(t)} className={cn(chipClass(tone === t), 'flex items-center justify-between')}>
              {t}
              {tone === t && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-600">Target audience location</label>
        <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scrollbar">
          {COUNTRIES.map((c) => (
            <button key={c} type="button" onClick={() => setCountry(c)} className={cn(chipClass(country === c), 'text-left')}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </OnboardingStepShell>
  );
};
