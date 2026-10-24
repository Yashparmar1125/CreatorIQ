import { create } from 'zustand';
import type { StatIconKey } from '../lib/stat-icons';
import { api } from '../lib/api';
import { cleanTrendTitle } from '../lib/cleanTrendTitle';
import { useStrategyStore } from './useStrategyStore';

export interface DashboardStat {
  label: string;
  value: string;
  trend: string;
  icon: StatIconKey;
}

export interface DashboardInsight {
  id: string;
  title: string;
  impact: string;
  trendId?: string;
}

/** The creator's real connected channel with Phase 2 Performance DNA. */
export interface ConnectedChannel {
  id: string;
  name: string;
  handle: string | null;
  thumbnail_url: string | null;
  subscriber_count: number;
  view_count: number;
  video_count: number;
  niches: string[];
  youtube_channel_id?: string;
  is_oauth_connected: boolean;
  median_reach_ratio?: number;
  dominant_traffic_source?: string;
  speech_tempo_wpm?: number;
  median_retention_30s_pct?: number;
  engagement_rate?: number;
}

interface DashboardState {
  stats: DashboardStat[];
  insights: DashboardInsight[];
  primaryChannel: ConnectedChannel | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: [],
  insights: [],
  primaryChannel: null,
  isLoading: false,
  error: null,
  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const [channelsRes, profileRes, trendsRes] = await Promise.all([
        api.get('/channels').catch(() => null),
        api.get('/channels/profile').catch(() => null),
        api.get('/trends').catch(() => null),
      ]);

      const channels = channelsRes?.data?.data?.channels || [];
      const primary = channels.find((c: any) => c.is_primary) || channels[0];
      const profile = profileRes?.data?.data;
      const trends: any[] = trendsRes?.data?.data?.trends || [];

      const primaryChannel: ConnectedChannel | null = primary
        ? {
            id: primary.id,
            name: primary.name ?? 'Connected channel',
            handle: primary.handle ?? null,
            thumbnail_url: primary.thumbnail_url ?? null,
            subscriber_count: Number(primary.subscriber_count ?? 0),
            view_count: Number(primary.view_count ?? 0),
            video_count: Number(primary.video_count ?? 0),
            niches: Array.isArray(primary.niches) ? primary.niches : [],
            youtube_channel_id: primary.youtube_channel_id ?? '',
            is_oauth_connected: Boolean(
              primary.is_oauth_connected ??
              (primary.youtube_channel_id && !primary.youtube_channel_id.startsWith('manual-'))
            ),
            median_reach_ratio: primary.median_reach_ratio != null ? Number(primary.median_reach_ratio) : undefined,
            dominant_traffic_source: primary.dominant_traffic_source ?? undefined,
            speech_tempo_wpm: primary.speech_tempo_wpm != null ? Number(primary.speech_tempo_wpm) : undefined,
            median_retention_30s_pct: primary.median_retention_30s_pct != null ? Number(primary.median_retention_30s_pct) : undefined,
            engagement_rate: primary.engagement_rate != null ? Number(primary.engagement_rate) : undefined,
          }
        : null;

      // Keep Copilot connector state aligned with genuine YouTube connection status
      if (primaryChannel?.is_oauth_connected) {
        useStrategyStore.getState().connectConnector('youtube');
      } else {
        useStrategyStore.getState().disconnectConnector('youtube');
      }

      // Build dynamic AI Priority Insights from top predicted trends
      const dynamicInsights: DashboardInsight[] = trends.slice(0, 3).map((t: any, idx: number) => {
        const score = Math.round(t.opportunity_score ?? t.tvs_score ?? 80);
        const reachInfo =
          t.reach_ratio_median != null
            ? `${Number(t.reach_ratio_median).toFixed(1)}x median reach ratio`
            : t.velocity || 'High velocity';
        return {
          id: t.id || `insight-${idx}`,
          title: `Publish on "${cleanTrendTitle(t.topic)}" (${t.archetype || 'Breakout'})`,
          impact: `${score}/100 Opportunity Fit · ${reachInfo}`,
          trendId: t.id,
        };
      });

      if (primaryChannel?.is_oauth_connected) {
        const stats: DashboardStat[] = [
          {
            label: 'Total Views',
            value: formatNumber(primary.view_count || 0),
            trend: 'Channel total',
            icon: 'eye',
          },
          {
            label: 'Subscribers',
            value: formatNumber(primary.subscriber_count || 0),
            trend: primary.handle || 'Connected',
            icon: 'users',
          },
          {
            label: 'Videos',
            value: primary.video_count?.toString() || '0',
            trend: 'Indexed',
            icon: 'video',
          },
          {
            label: 'Engagement',
            value: primary.engagement_rate != null ? `${primary.engagement_rate}%` : 'Active',
            trend: primary.engagement_rate > 5 ? '+High' : 'Normal',
            icon: 'trending',
          },
        ];
        set({ stats, insights: dynamicInsights, primaryChannel, isLoading: false });
      } else {
        // Derive live intelligence stats from CreatorProfile + live Trends feed
        const effectiveNiches: string[] =
          profile?.niches?.effective || profile?.niches?.onboarding_selected || [];
        const targetCountry = profile?.geo?.target_country || '';
        const topScore = trends.length
          ? Math.max(...trends.map((t) => Math.round(t.opportunity_score ?? t.tvs_score ?? 0)))
          : 0;
        const outlierCount = trends.filter(
          (t) => Boolean(t.is_momentum_outlier) || (t.outlier_streak && t.outlier_streak > 0)
        ).length;

        const stats: DashboardStat[] = [
          {
            label: 'Active Opportunities',
            value: String(trends.length),
            trend: effectiveNiches.slice(0, 2).join(' · '),
            icon: 'trending',
          },
          {
            label: 'Peak Opportunity Fit',
            value: topScore ? `${topScore}/100` : 'No data',
            trend: trends.length ? 'Live ranking' : 'Feed empty',
            icon: 'eye',
          },
          {
            label: 'Breakout Signals',
            value: String(outlierCount),
            trend: trends.length ? 'Outlier flagged' : 'Feed empty',
            icon: 'video',
          },
          {
            label: 'Target Audience',
            value: targetCountry || 'Not set',
            trend: effectiveNiches.length ? `${effectiveNiches.length} niches active` : 'No niches set',
            icon: 'users',
          },
        ];
        set({ stats, insights: dynamicInsights, primaryChannel, isLoading: false });
      }
    } catch (err: any) {
      console.error('Dashboard fetch failed:', err);
      set({ isLoading: false, error: 'Could not load dashboard metrics' });
    }
  },
}));

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
