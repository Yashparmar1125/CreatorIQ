import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Sparkles, Save, Check, Sliders, Cpu, Plus, X } from 'lucide-react';
import { api } from '../../../lib/api';
import { MaturityBadge, type ProfileMaturity } from '../../onboarding/components/MaturityBadge';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';

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

interface ReconfigureChanges {
  niches_effective: { before: string[]; after: string[] };
  profile_maturity: { before: string; after: string };
  geo_source: { before: string; after: string };
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
  { code: 'India', label: '🇮🇳 India' },
  { code: 'United States', label: '🇺🇸 United States' },
  { code: 'United Kingdom', label: '🇬🇧 United Kingdom' },
  { code: 'Canada', label: '🇨🇦 Canada' },
  { code: 'Australia', label: '🇦🇺 Australia' },
  { code: 'Germany', label: '🇩🇪 Germany' },
  { code: 'Japan', label: '🇯🇵 Japan' },
  { code: 'Global', label: '🌐 Global' },
];

const FORMAT_OPTIONS = [
  { id: 'both', label: 'Hybrid (Shorts & Long-form)', desc: 'Surface all content formats' },
  { id: 'shorts', label: 'Shorts Only', desc: 'Focus on vertical short videos (<60s)' },
  { id: 'long-form', label: 'Long-form Only', desc: 'Focus on horizontal deep-dive videos' },
];

const TONE_OPTIONS = [
  { id: 'conversational', label: 'Conversational', desc: 'Friendly, relatable, casual' },
  { id: 'energetic', label: 'Energetic', desc: 'High energy, hyped, fast-paced' },
  { id: 'informative', label: 'Informative', desc: 'Educational, clear, structured' },
  { id: 'storytelling', label: 'Storytelling', desc: 'Narrative-driven, immersive' },
  { id: 'humorous', label: 'Humorous', desc: 'Funny, satirical, comedic' },
  { id: 'professional', label: 'Professional', desc: 'Polished, authoritative, expert' },
];

export const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [changes, setChanges] = useState<ReconfigureChanges | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconfiguring, setReconfiguring] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active Tab: 'manual' | 'auto'
  const [activeMode, setActiveMode] = useState<'manual' | 'auto'>('manual');

  // Manual Form State
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [customNicheInput, setCustomNicheInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedFormat, setSelectedFormat] = useState('both');
  const [selectedTone, setSelectedTone] = useState('conversational');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/channels/profile');
      const p = data.data as CreatorProfile;
      setProfile(p);

      // Populate Manual Form with current effective values
      setSelectedNiches(p.niches.effective || p.niches.onboarding_selected || []);
      setSelectedCountry(p.geo.target_country || 'India');
      setSelectedFormat(p.content_format || 'both');
      setSelectedTone(p.tone || 'conversational');
    } catch {
      setError('No creator profile found. Complete onboarding first.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleReconfigureAuto = async () => {
    setReconfiguring(true);
    setError(null);
    setSuccess(null);
    setChanges(null);
    try {
      await api.post('/auth/sync/channel');
      const { data } = await api.post('/channels/profile/reconfigure');
      const updated = data.data.profile as CreatorProfile;
      setProfile(updated);
      setChanges(data.data.changes as ReconfigureChanges);
      setSuccess('Profile automatically reconfigured from your latest YouTube analytics & metadata!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string }; detail?: { message?: string } } } };
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.detail?.message ||
          'Auto-reconfigure failed. Try again.'
      );
    } finally {
      setReconfiguring(false);
    }
  };

  const handleSaveManual = async () => {
    if (selectedNiches.length === 0) {
      setError('Please select at least 1 Category / Niche.');
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

      const updated = data.data as CreatorProfile;
      setProfile(updated);
      setSuccess('Manual profile settings saved successfully! Your trends will update automatically.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string }; detail?: { message?: string } } } };
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.detail?.message ||
          'Failed to save manual settings. Try again.'
      );
    } finally {
      setSavingManual(false);
    }
  };

  const toggleNiche = (niche: string) => {
    if (selectedNiches.includes(niche)) {
      setSelectedNiches(selectedNiches.filter((n) => n !== niche));
    } else {
      setSelectedNiches([...selectedNiches, niche]);
    }
  };

  const handleAddCustomNiche = () => {
    const trimmed = customNicheInput.trim();
    if (trimmed && !selectedNiches.includes(trimmed)) {
      setSelectedNiches([...selectedNiches, trimmed]);
      setCustomNicheInput('');
    }
  };

  if (loading) {
    return <div className="h-48 animate-pulse rounded-lg border border-neutral-200 bg-white" />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in">
      <PageHeader
        title="Creator Profile & Preferences"
        description="Configure how CreatorIQ & Qdrant Vector AI personalize your trend recommendations — choose Automatic YouTube Sync or Manual Custom Control."
      />

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {profile && (
        <div className="space-y-6">
          {/* Channel Overview Card */}
          <Card className="surface-card-elevated">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  {profile.channel_stats.channel_name || 'Connected Channel'}
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  {(profile.channel_stats.subscriber_count ?? 0).toLocaleString()} Subscribers ·{' '}
                  {profile.channel_stats.video_count ?? 0} Videos Published
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MaturityBadge maturity={profile.profile_maturity} />
              </div>
            </div>
          </Card>

          {/* Mode Switcher Tabs (Manual vs Automatic) */}
          <div className="flex rounded-xl border border-neutral-200 bg-neutral-100/80 p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveMode('manual')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                activeMode === 'manual'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Sliders className="h-4 w-4 text-brand-600" />
              Manual Custom Control
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('auto')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                activeMode === 'auto'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Cpu className="h-4 w-4 text-cyan-600" />
              Automatic YouTube AI Sync
            </button>
          </div>

          {/* TAB 1: MANUAL CUSTOM PROFILE SETTINGS */}
          {activeMode === 'manual' && (
            <Card variant="elevated" className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Manual Profile Preferences</h3>
                <p className="text-xs text-neutral-500">
                  Customize your niche, audience geography, content format, and tone manually.
                </p>
              </div>

              {/* 1. Category / Niche Selection */}
              <div className="space-y-3 border-t border-neutral-100 pt-4">
                <label className="block text-xs font-bold text-neutral-900">
                  1. Category / Niche (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_NICHES.map((niche) => {
                    const isSelected = selectedNiches.includes(niche);
                    return (
                      <button
                        key={niche}
                        type="button"
                        onClick={() => toggleNiche(niche)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-400/20'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {niche}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Niche Add Input */}
                <div className="flex gap-2 pt-2 sm:max-w-md">
                  <input
                    type="text"
                    placeholder="Add custom niche (e.g. AI Automation)..."
                    value={customNicheInput}
                    onChange={(e) => setCustomNicheInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomNiche();
                      }
                    }}
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none"
                  />
                  <Button size="sm" variant="secondary" type="button" onClick={handleAddCustomNiche}>
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>

                {/* Currently Selected Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-neutral-400">Selected ({selectedNiches.length}):</span>
                  {selectedNiches.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800"
                    >
                      {n}
                      <button
                        type="button"
                        onClick={() => toggleNiche(n)}
                        className="text-brand-600 hover:text-brand-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 2. Target Audience Geography */}
              <div className="space-y-3 border-t border-neutral-100 pt-4">
                <label className="block text-xs font-bold text-neutral-900">
                  2. Target Audience Country
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCountry(c.code)}
                      className={`flex items-center justify-between rounded-lg border p-2.5 text-xs font-medium transition-all ${
                        selectedCountry === c.code
                          ? 'border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-400/20'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <span>{c.label}</span>
                      {selectedCountry === c.code && <Check className="h-3.5 w-3.5 text-brand-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Primary Content Format */}
              <div className="space-y-3 border-t border-neutral-100 pt-4">
                <label className="block text-xs font-bold text-neutral-900">
                  3. Primary Content Format
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFormat(f.id)}
                      className={`rounded-xl border p-3.5 text-left transition-all ${
                        selectedFormat === f.id
                          ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-400/20'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-900">{f.label}</span>
                        {selectedFormat === f.id && <Check className="h-4 w-4 text-brand-600" />}
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-500">{f.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Channel Tone */}
              <div className="space-y-3 border-t border-neutral-100 pt-4">
                <label className="block text-xs font-bold text-neutral-900">
                  4. Channel Tone & Voice
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTone(t.id)}
                      className={`rounded-lg border p-2.5 text-left transition-all ${
                        selectedTone === t.id
                          ? 'border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-400/20'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold capitalize">{t.label}</span>
                        {selectedTone === t.id && <Check className="h-3.5 w-3.5 text-brand-600" />}
                      </div>
                      <p className="mt-0.5 text-[10px] text-neutral-500">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t border-neutral-100 pt-4">
                <Button onClick={() => void handleSaveManual()} disabled={savingManual} className="w-full sm:w-auto">
                  <Save className={`h-4 w-4 ${savingManual ? 'animate-spin' : ''}`} />
                  {savingManual ? 'Saving Preferences...' : 'Save Manual Profile Settings'}
                </Button>
              </div>
            </Card>
          )}

          {/* TAB 2: AUTOMATIC YOUTUBE AI SYNC */}
          {activeMode === 'auto' && (
            <Card variant="elevated" className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Automatic YouTube AI Sync</h3>
                <p className="text-xs text-neutral-500">
                  CreatorIQ automatically inspects your connected YouTube channel&apos;s upload history, video titles, and engagement rates to infer your exact niche and target audience.
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 border-t border-neutral-100 pt-4">
                <div>
                  <dt className="text-xs text-neutral-500">Auto-Detected Niches</dt>
                  <dd className="mt-1 font-medium text-neutral-900">
                    {profile.niches.inferred.join(', ') || profile.niches.effective.join(', ') || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Sync Status</dt>
                  <dd className="mt-1 font-medium capitalize text-neutral-900">
                    {profile.sync_status.replace('_', ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Target Audience Geo</dt>
                  <dd className="mt-1 font-medium text-neutral-900">
                    {profile.geo.target_country || 'Auto-Detected'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Last AI Analysis</dt>
                  <dd className="mt-1 font-medium text-neutral-900">
                    {profile.last_reconfigured_at
                      ? new Date(profile.last_reconfigured_at).toLocaleString()
                      : 'Never'}
                  </dd>
                </div>
              </dl>

              {changes && (
                <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm">
                  <p className="flex items-center gap-2 font-medium text-brand-800">
                    <Sparkles className="h-4 w-4" />
                    What changed
                  </p>
                  <p className="mt-2 text-neutral-700">
                    Maturity: {changes.profile_maturity.before} →{' '}
                    <strong>{changes.profile_maturity.after}</strong>
                  </p>
                  <p className="text-neutral-700">
                    Niches: {changes.niches_effective.before.join(', ') || '—'} →{' '}
                    <strong>{changes.niches_effective.after.join(', ') || '—'}</strong>
                  </p>
                </div>
              )}

              <div className="border-t border-neutral-100 pt-4">
                <Button onClick={() => void handleReconfigureAuto()} disabled={reconfiguring}>
                  <RefreshCw className={`h-4 w-4 ${reconfiguring ? 'animate-spin' : ''}`} />
                  {reconfiguring ? 'Reconfiguring...' : 'Reconfigure recommendations from YouTube'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
