import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
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

export const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [changes, setChanges] = useState<ReconfigureChanges | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconfiguring, setReconfiguring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/channels/profile');
      setProfile(data.data as CreatorProfile);
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

  const handleReconfigure = async () => {
    setReconfiguring(true);
    setError(null);
    setSuccess(null);
    setChanges(null);
    try {
      await api.post('/auth/sync/channel');
      const { data } = await api.post('/channels/profile/reconfigure');
      setProfile(data.data.profile as CreatorProfile);
      setChanges(data.data.changes as ReconfigureChanges);
      setSuccess('Profile reconfigured from your latest YouTube data.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string }; detail?: { message?: string } } } };
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.detail?.message ||
          'Reconfigure failed. Try again.'
      );
    } finally {
      setReconfiguring(false);
    }
  };

  if (loading) {
    return <div className="h-48 animate-pulse rounded-lg border border-neutral-200 bg-white" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in">
      <PageHeader
        title="Settings"
        description="Manage your creator profile and refresh recommendations from YouTube."
      />

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {profile && (
        <Card className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-medium text-neutral-900">
                {profile.channel_stats.channel_name || 'Your channel'}
              </p>
              <p className="mt-1 text-sm text-neutral-500 capitalize">
                {profile.profile_mode.replace('_', ' ')} · {profile.sync_status.replace('_', ' ')}
              </p>
            </div>
            <MaturityBadge maturity={profile.profile_maturity} />
          </div>

          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-neutral-500">Effective niches</dt>
              <dd className="mt-1 font-medium text-neutral-900">
                {profile.niches.effective.join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Inferred niches</dt>
              <dd className="mt-1 font-medium text-neutral-900">
                {profile.niches.inferred.join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Format & tone</dt>
              <dd className="mt-1 font-medium capitalize text-neutral-900">
                {profile.content_format.replace('_', ' ')} · {profile.tone}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Audience geography</dt>
              <dd className="mt-1 font-medium text-neutral-900">
                {profile.geo.source.replace('_', ' ')}
                {profile.geo.target_country ? ` · ${profile.geo.target_country}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Channel stats</dt>
              <dd className="mt-1 font-medium text-neutral-900">
                {(profile.channel_stats.subscriber_count ?? 0).toLocaleString()} subs ·{' '}
                {profile.channel_stats.video_count ?? 0} videos
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Last reconfigured</dt>
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

          <Button onClick={() => void handleReconfigure()} disabled={reconfiguring}>
            <RefreshCw className={`h-4 w-4 ${reconfiguring ? 'animate-spin' : ''}`} />
            {reconfiguring ? 'Reconfiguring...' : 'Reconfigure recommendations'}
          </Button>
        </Card>
      )}
    </div>
  );
};
