import React, { useCallback, useEffect, useState } from 'react';
import { Save, Check, Plus, X } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [savingManual, setSavingManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    return <div className="h-48 animate-pulse rounded-xl border border-[#222222] bg-[#121212]" />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in">
      <PageHeader
        title={<span className="text-white font-semibold">Creator Profile & Preferences</span>}
        description="Configure how CreatorIQ and Qdrant Vector AI personalize your trend recommendations and opportunity scoring."
      />

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {profile && (
        <div className="space-y-6">
          {/* Channel Overview Card */}
          <Card className="bg-[#121212] border-[#222222] p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-bold text-[#ededed]">
                  {profile.channel_stats.channel_name || 'Channel Profile'}
                </h3>
                <p className="mt-1 text-xs text-neutral-400">
                  <span className="font-mono text-neutral-300">{(profile.channel_stats.subscriber_count ?? 0).toLocaleString()}</span> Subscribers
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MaturityBadge maturity={profile.profile_maturity} />
              </div>
            </div>
          </Card>

          {/* MANUAL CUSTOM PROFILE SETTINGS */}
          <Card variant="elevated" className="space-y-6 bg-[#121212] border-[#222222] p-6">
            <div>
              <h3 className="text-sm font-bold text-[#ededed]">Manual Profile Preferences</h3>
              <p className="text-xs text-neutral-500">
                Customize your niche, audience geography, content format, and channel tone manually.
              </p>
            </div>

            {/* 1. Category / Niche Selection */}
            <div className="space-y-3 border-t border-[#222222] pt-4">
              <label className="block text-xs font-semibold text-[#ededed]">
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
                          ? 'border-brand-500/50 bg-brand-950/40 text-brand-300 ring-1 ring-brand-500/30'
                          : 'border-[#262626] bg-[#161616] text-neutral-400 hover:bg-[#1e1e1e] hover:text-neutral-200'
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
                  className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 py-1.5 text-xs text-[#ededed] placeholder:text-neutral-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Button size="sm" variant="secondary" type="button" onClick={handleAddCustomNiche} className="bg-[#1a1a1a] border-[#2e2e2e] text-[#ededed]">
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>

              {/* Currently Selected Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-neutral-500">Selected ({selectedNiches.length}):</span>
                {selectedNiches.map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-1 rounded-md bg-[#1c1c1c] border border-[#2c2c2c] px-2 py-0.5 text-xs font-medium text-brand-300"
                  >
                    {n}
                    <button
                      type="button"
                      onClick={() => toggleNiche(n)}
                      className="text-neutral-500 hover:text-neutral-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Target Audience Geography */}
            <div className="space-y-3 border-t border-[#222222] pt-4">
              <label className="block text-xs font-semibold text-[#ededed]">
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
                        ? 'border-brand-500/50 bg-brand-950/40 text-white ring-1 ring-brand-500/30'
                        : 'border-[#262626] bg-[#161616] text-neutral-400 hover:bg-[#1e1e1e] hover:text-neutral-200'
                    }`}
                  >
                    <span>{c.label}</span>
                    {selectedCountry === c.code && <Check className="h-3.5 w-3.5 text-brand-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Primary Content Format */}
            <div className="space-y-3 border-t border-[#222222] pt-4">
              <label className="block text-xs font-semibold text-[#ededed]">
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
                        ? 'border-brand-500/50 bg-brand-950/30 ring-1 ring-brand-500/30'
                        : 'border-[#262626] bg-[#161616] hover:bg-[#1e1e1e]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#ededed]">{f.label}</span>
                      {selectedFormat === f.id && <Check className="h-4 w-4 text-brand-400" />}
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-500">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Channel Tone */}
            <div className="space-y-3 border-t border-[#222222] pt-4">
              <label className="block text-xs font-semibold text-[#ededed]">
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
                        ? 'border-brand-500/50 bg-brand-950/30 text-white ring-1 ring-brand-500/30'
                        : 'border-[#262626] bg-[#161616] text-neutral-400 hover:bg-[#1e1e1e] hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold capitalize">{t.label}</span>
                      {selectedTone === t.id && <Check className="h-3.5 w-3.5 text-brand-400" />}
                    </div>
                    <p className="mt-0.5 text-[10px] text-neutral-500">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-[#222222] pt-4">
              <Button onClick={() => void handleSaveManual()} disabled={savingManual} className="w-full sm:w-auto">
                <Save className={`h-4 w-4 ${savingManual ? 'animate-spin' : ''}`} />
                {savingManual ? 'Saving Preferences...' : 'Save Profile Settings'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
