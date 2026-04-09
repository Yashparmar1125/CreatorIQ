import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

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
  'Brazil', 'Japan', 'Germany', 'France', 'Spain', 'Mexico', 'South Korea', 'Italy'
];

const FORMATS: { label: string; value: PrimaryFormat }[] = [
  { label: 'Long-form', value: 'long-form' },
  { label: 'Shorts', value: 'shorts' },
  { label: 'Hybrid', value: 'hybrid' }
];

const TONES = ['Educational', 'Magnetic', 'Expert', 'Casual'];

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
  onBack
}) => {
  const isCompleteDisabled = !format || !tone || !country || !frequency || isLoading;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 max-w-2xl mx-auto"
    >
      <div className="space-y-3">
        <h2 className="text-3xl font-bold font-sora text-white tracking-tight">Channel Strategy</h2>
        <p className="text-neutral-500 font-medium text-sm">Help us tailor recommendations to your style and audience.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div className="p-8 bg-neutral-900 border border-white/5 rounded-[32px] space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Primary Format</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    "py-3 rounded-xl border text-[10px] uppercase font-black tracking-wider transition-all",
                    format === f.value ? "bg-brand-600 border-brand-600 text-white shadow-lg" : "bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Posting Frequency</label>
            <select 
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-sm outline-none transition-all appearance-none cursor-pointer hover:bg-white/10"
              value={frequency || ''}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="" className="bg-neutral-900">Select frequency...</option>
              <option value="daily" className="bg-neutral-900">Daily</option>
              <option value="3x_week" className="bg-neutral-900">3x per Week</option>
              <option value="weekly" className="bg-neutral-900">Weekly</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Channel Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={cn(
                    "py-3 px-4 rounded-xl border text-[10px] uppercase font-bold tracking-wider transition-all text-left flex justify-between items-center",
                    tone === t ? "bg-brand-600 border-brand-600 text-white shadow-lg" : "bg-white/5 border-white/5 text-neutral-500 hover:text-white hover:bg-white/10"
                  )}
                >
                  {t}
                  {tone === t && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 bg-neutral-900 border border-white/5 rounded-[32px] space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-1">Target Audience Location</label>
            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
              {COUNTRIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={cn(
                    "px-4 py-3 rounded-xl border transition-all font-bold text-[10px] uppercase tracking-wider text-left flex items-center justify-between",
                    country === c 
                      ? "bg-brand-600 border-brand-600 text-white shadow-lg" 
                      : "bg-white/5 border-white/5 text-neutral-500 hover:border-white/10 hover:text-white"
                  )}
                >
                  {c}
                  {country === c && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
         <button onClick={onBack} className="px-6 py-3 bg-white/5 text-neutral-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all">Back</button>
         <button 
          onClick={onComplete} 
          disabled={isCompleteDisabled}
          className="px-10 py-3 bg-white text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-neutral-100 disabled:opacity-20 transition-all active:scale-95 flex items-center gap-2"
         >
           {isLoading ? (
             <>
               <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
               Saving...
             </>
           ) : 'Finish Setup'}
         </button>
      </div>
      {error && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-4">{error}</p>}
    </motion.div>
  );
};
