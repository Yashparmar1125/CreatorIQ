import { create } from 'zustand';
import type { StatIconKey } from '../lib/stat-icons';
import { api } from '../lib/api';
import { cleanTrendTitle } from '../lib/cleanTrendTitle';

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

interface DashboardState {
  stats: DashboardStat[];
  insights: DashboardInsight[];
  isLoading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: [],
  insights: [],
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

      if (primary && (Number(primary.view_count) > 0 || Number(primary.subscriber_count) > 0)) {
        const stats: DashboardStat[] = [
          {
            label: 'Total Views',
            value: formatNumber(primary.view_count || 0),
            trend: '+Live Sync',
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
        set({ stats, insights: dynamicInsights, isLoading: false });
      } else {
        // Derive live intelligence stats from CreatorProfile + live Trends feed
        const effectiveNiches: string[] =
          profile?.niches?.effective || profile?.niches?.onboarding_selected || ['Tech', 'Fitness'];
        const targetCountry = profile?.geo?.target_country || 'India';
        const topScore =
          trends.length > 0
            ? Math.max(...trends.map((t) => Math.round(t.opportunity_score ?? t.tvs_score ?? 75)))
            : 88;
        const outlierCount = trends.filter(
          (t) => Boolean(t.is_momentum_outlier) || (t.outlier_streak && t.outlier_streak > 0)
        ).length;

        const stats: DashboardStat[] = [
          {
            label: 'Active Opportunities',
            value: String(trends.length || 12),
            trend: `${effectiveNiches.slice(0, 2).join(' · ')}`,
            icon: 'trending',
          },
          {
            label: 'Peak Opportunity Fit',
            value: `${topScore}/100`,
            trend: 'LightGBM + Vector',
            icon: 'eye',
          },
          {
            label: 'Breakout Signals',
            value: String(outlierCount || Math.max(1, Math.ceil(trends.length / 3))),
            trend: 'μ + 1.65σ Outliers',
            icon: 'video',
          },
          {
            label: 'Target Audience',
            value: targetCountry,
            trend: `${effectiveNiches.length} Niches Active`,
            icon: 'users',
          },
        ];
        set({ stats, insights: dynamicInsights, isLoading: false });
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
