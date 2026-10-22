import React, { useCallback, useEffect, useState } from 'react';
import { Check, Globe, Plus, Save, X } from 'lucide-react';
import { api } from '../../../lib/api';
import { MaturityBadge, type ProfileMaturity } from '../../onboarding/components/MaturityBadge';

interface CreatorProfile {
  profile_maturity: ProfileMaturity;
  profile_mode: string;
  niches: {
    effective: string[];
    onboarding_selected: string[];
    inferred: string[];
    source: string;
  };
  content_format: string;
  posting_frequency: string | null;
  tone: string;
  geo: {
    source: string;
    target_country: string | null;
    audience_weights: Record<string, number>;
  };
  channel_stats: {
    subscriber_count?: number;
    video_count?: number;
    view_count?: number;
    engagement_rate?: number | null;
    channel_name?: string | null;
  };
  sync_status: string;
  last_analyzed_at: string | null;
  last_reconfigured_at: string | null;
}

const PRESET_NICHES = [
  'Tech',
  'Gaming',
  'Education',
  'Fitness',
  'Beauty',
  'Cooking',
  'Finance',
  'Travel',
  'Music',
  'Entertainment',
  'Shorts',
  'Vlogging',
  'Automotive',
  'Lifestyle',
];

const COUNTRIES = [
  { code: 'India', label: 'India' },
  { code: 'United States', label: 'United States' },
  { code: 'United Kingdom', label: 'United Kingdom' },
  { code: 'Canada', label: 'Canada' },
  { code: 'Australia', label: 'Australia' },
  { code: 'Germany', label: 'Germany' },
  { code: 'Japan', label: 'Japan' },
  { code: 'Global', label: 'Global' },
];

const FORMAT_OPTIONS = [
  { id: 'both', label: 'Hybrid', desc: 'Shorts and long-form' },
  { id: 'shorts', label: 'Shorts only', desc: 'Vertical videos under 60s' },
  { id: 'long-form', label: 'Long-form only', desc: 'Horizontal deep dives' },
];

const TONE_OPTIONS = [
  { id: 'conversational', label: 'Conversational', desc: 'Friendly and casual' },
  { id: 'energetic', label: 'Energetic', desc: 'Fast and high energy' },
  { id: 'informative', label: 'Informative', desc: 'Clear and structured' },
  { id: 'storytelling', label: 'Storytelling', desc: 'Narrative driven' },
  { id: 'humorous', label: 'Humorous', desc: 'Funny and satirical' },
  { id: 'professional', label: 'Professional', desc: 'Polished and expert' },
];

function formatCount(value?: number): string {
  if (value == null) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return value.toLocaleString();
}

function formatDate(value: string | null): string {
  if (!value) return 'Not yet';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 'Not yet';
  return new Date(parsed).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function humanize(value: string): string {
  if (value === 'essential_complete') return 'Core profile complete';
  return value.replace(/_/g, ' ');
}

const chipBase =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors';

export const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingManual, setSavingManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [customNicheInput, setCustomNicheInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedFormat, setSelectedFormat] = useState('both');
  const [selectedTone, setSelectedTone] = useState('conversational');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get('/channels/profile');
      const p = data.data as CreatorProfile;
      setProfile(p);
      setSelectedNiches(p.niches?.effective || p.niches?.onboarding_selected || []);
      setSelectedCountry(p.geo?.target_country || 'India');
      setSelectedFormat(p.content_format || 'both');
      setSelectedTone(p.tone || 'conversational');
    } catch {
      setProfile(null);
      setLoadError(
        'We could not load your saved profile. You can still set preferences below; saving will create them.',
      );
      setSelectedNiches([]);
      setSelectedCountry('India');
      setSelectedFormat('both');
      setSelectedTone('conversational');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSaveManual = async () => {
    if (selectedNiches.length === 0) {
      setError('Select at least one category or niche.');
      return;
    }

    setSavingManual(true);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await api.put('/channels/profile', {
        niches: selectedNiches,
        content_format: selectedFormat,
        tone: selectedTone,
        target_country: selectedCountry,
      });

      setProfile(data.data as CreatorProfile);
      setLoadError(null);
      void api.post('/trends/refresh').catch(() => null);
      setSuccess('Preferences saved. Your personalized trend feed has been refreshed.');
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { error?: { message?: string }; detail?: { message?: string } } };
      };
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.detail?.message ||
          'Failed to save settings. Try again.',
      );
    } finally {
      setSavingManual(false);
    }
  };

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche],
    );
  };

  const handleAddCustomNiche = () => {
    const trimmed = customNicheInput.trim();
    if (!trimmed) return;
    setSelectedNiches((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCustomNicheInput('');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-20 animate-pulse rounded-2xl border border-[#E5E0E8] bg-white" />
        <div className="h-64 animate-pulse rounded-2xl border border-[#E5E0E8] bg-white" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-cal-sans text-2xl font-bold tracking-tight text-[#171717]">
          Creator profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#625D68]">
          These preferences filter and rank every trend recommendation. Change them whenever your
          channel direction changes.
        </p>
      </div>

      {loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F3C9CE] bg-[#FDF1F2] px-4 py-3">
          <p className="text-[13px] leading-relaxed text-[#8A1B26]">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadProfile()}
            className="rounded-full border border-[#E7B6BD] bg-white px-3 py-1.5 text-xs font-semibold text-[#8A1B26] transition-colors hover:bg-[#FFF4F5]"
          >
            Retry
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[#F3C9CE] bg-[#FDF1F2] px-4 py-3 text-[13px] leading-relaxed text-[#8A1B26]">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-[#BDEBD8] bg-[#EFFBF6] px-4 py-3 text-[13px] leading-relaxed text-[#0F5C43]">
          {success}
        </div>
      )}

      {profile && (
        <section
          aria-labelledby="channel-overview-title"
          className="rounded-2xl border border-[#E5E0E8] bg-white p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                id="channel-overview-title"
                className="font-cal-sans text-base font-bold text-[#171717]"
              >
                {profile.channel_stats.channel_name || 'Connected channel'}
              </h2>
              <p className="mt-1 text-xs text-[#77717F]">
                Profile mode: {profile.profile_mode.replace(/_/g, ' ')} ·{' '}
                {humanize(profile.sync_status)}
              </p>
            </div>
            <MaturityBadge maturity={profile.profile_maturity} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[#EFEBF2] pt-4 sm:grid-cols-4">
            {[
              { label: 'Subscribers', value: formatCount(profile.channel_stats.subscriber_count) },
              { label: 'Videos', value: formatCount(profile.channel_stats.video_count) },
              { label: 'Views', value: formatCount(profile.channel_stats.view_count) },
              { label: 'Last analyzed', value: formatDate(profile.last_analyzed_at) },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-[#9B94A5]">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-mono text-sm font-bold text-[#171717]">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section
        aria-labelledby="preferences-title"
        className="rounded-2xl border border-[#E5E0E8] bg-white p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="preferences-title" className="font-cal-sans text-base font-bold text-[#171717]">
              Manual preferences
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#77717F]">
              Saving updates your profile and requests a fresh trend feed.
            </p>
          </div>
          <span className="rounded-full border border-[#E5E0E8] bg-[#FBFAF8] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#77717F]">
            {selectedNiches.length} niche{selectedNiches.length === 1 ? '' : 's'}
          </span>
        </div>

        <fieldset className="mt-6 border-t border-[#EFEBF2] pt-5">
          <legend className="text-xs font-bold uppercase tracking-wider text-[#625D68]">
            1. Categories and niches
          </legend>
          <p className="mt-1 text-[13px] text-[#77717F]">
            Choose everything that fits your channel. These drive trend filtering.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_NICHES.map((niche) => {
              const isSelected = selectedNiches.includes(niche);
              return (
                <button
                  key={niche}
                  type="button"
                  onClick={() => toggleNiche(niche)}
                  aria-pressed={isSelected}
                  className={`${chipBase} ${
                    isSelected
                      ? 'border-[#C9B8EE] bg-[#F1ECFF] text-[#4A2E8F]'
                      : 'border-[#E5E0E8] bg-white text-[#625D68] hover:border-[#D5C9E8] hover:bg-[#FBFAF8] hover:text-[#171717]'
                  }`}
                >
                  {isSelected ? (
                    <Check size={13} aria-hidden="true" />
                  ) : (
                    <Plus size={13} aria-hidden="true" />
                  )}
                  {niche}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:max-w-md sm:flex-row">
            <label htmlFor="custom-niche" className="sr-only">
              Add a custom niche
            </label>
            <input
              id="custom-niche"
              type="text"
              placeholder="Add a niche (e.g. AI automation)"
              value={customNicheInput}
              onChange={(e) => setCustomNicheInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomNiche();
                }
              }}
              className="app-field w-full px-3 py-2 text-sm text-[#171717] placeholder:text-[#9B94A5] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCustomNiche}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#D8CBF0] bg-[#F6F3FF] px-4 text-xs font-bold text-[#4A2E8F] transition-colors hover:bg-[#EFE8FF]"
            >
              <Plus size={14} aria-hidden="true" />
              Add
            </button>
          </div>

          {selectedNiches.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#9B94A5]">Selected</span>
              {selectedNiches.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center gap-1 rounded-full border border-[#D9CEF5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#4A2E8F]"
                >
                  {n}
                  <button
                    type="button"
                    onClick={() => toggleNiche(n)}
                    aria-label={`Remove ${n}`}
                    className="cursor-pointer text-[#9B8FB0] transition-colors hover:text-[#8A1B26]"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className="mt-6 border-t border-[#EFEBF2] pt-5">
          <legend className="text-xs font-bold uppercase tracking-wider text-[#625D68]">
            2. Target audience country
          </legend>
          <p className="mt-1 text-[13px] text-[#77717F]">
            Used for geographic relevance. Choose where your audience actually is.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COUNTRIES.map((c) => {
              const isSelected = selectedCountry === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCountry(c.code)}
                  aria-pressed={isSelected}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'border-[#C9B8EE] bg-[#F1ECFF] text-[#4A2E8F]'
                      : 'border-[#E5E0E8] bg-white text-[#625D68] hover:bg-[#FBFAF8] hover:text-[#171717]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Globe
                      size={14}
                      aria-hidden="true"
                      className={isSelected ? 'text-[#7C5CD6]' : 'text-[#9B94A5]'}
                    />
                    <span className="truncate">{c.label}</span>
                  </span>
                  {isSelected && <Check size={14} className="shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-6 border-t border-[#EFEBF2] pt-5">
          <legend className="text-xs font-bold uppercase tracking-wider text-[#625D68]">
            3. Primary content format
          </legend>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {FORMAT_OPTIONS.map((f) => {
              const isSelected = selectedFormat === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFormat(f.id)}
                  aria-pressed={isSelected}
                  className={`cursor-pointer rounded-xl border p-3.5 text-left transition-colors ${
                    isSelected
                      ? 'border-[#C9B8EE] bg-[#F1ECFF]'
                      : 'border-[#E5E0E8] bg-white hover:bg-[#FBFAF8]'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#171717]">{f.label}</span>
                    {isSelected && (
                      <Check size={15} className="shrink-0 text-[#167A59]" aria-hidden="true" />
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#77717F]">{f.desc}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-6 border-t border-[#EFEBF2] pt-5">
          <legend className="text-xs font-bold uppercase tracking-wider text-[#625D68]">
            4. Channel tone
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TONE_OPTIONS.map((t) => {
              const isSelected = selectedTone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTone(t.id)}
                  aria-pressed={isSelected}
                  className={`cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-[#C9B8EE] bg-[#F1ECFF]'
                      : 'border-[#E5E0E8] bg-white hover:bg-[#FBFAF8]'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#171717]">{t.label}</span>
                    {isSelected && (
                      <Check size={14} className="shrink-0 text-[#167A59]" aria-hidden="true" />
                    )}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#77717F]">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#EFEBF2] pt-5">
          <p className="text-[11px] text-[#77717F]">
            Saving requests a new trend feed, which uses one refresh credit.
          </p>
          <button
            type="button"
            onClick={() => void handleSaveManual()}
            disabled={savingManual}
            className="app-btn-pink h-10 px-5 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={15} aria-hidden="true" className={savingManual ? 'animate-spin' : ''} />
            {savingManual ? 'Saving…' : 'Save preferences'}
          </button>
        </div>
      </section>
    </div>
  );
};
