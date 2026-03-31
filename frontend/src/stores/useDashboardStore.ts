import { create } from 'zustand';
import { MOCK_DASHBOARD_STATS, MOCK_INSIGHTS } from '../lib/mock-data';
import { api } from '../lib/api';

interface DashboardState {
  stats: typeof MOCK_DASHBOARD_STATS;
  insights: typeof MOCK_INSIGHTS;
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
      // 1. Trigger live sync from YouTube
      try {
        await api.post('/auth/sync/channel');
      } catch (syncErr) {
        console.warn('Sync failed, showing cached data:', syncErr);
      }

      // 2. Fetch updated data from our DB
      const { data } = await api.get('/channels');
      const channels = data.data?.channels || [];
      const primary = channels.find((c: any) => c.is_primary) || channels[0];

      if (primary) {
        const stats = [
          { 
            label: 'Total Views', 
            value: formatNumber(primary.view_count || 0), 
            trend: '+5.2%', 
            icon: '👁️' 
          },
          { 
            label: 'Subscribers', 
            value: formatNumber(primary.subscriber_count || 0), 
            trend: '+2.1%', 
            icon: '👥' 
          },
          { 
            label: 'Videos', 
            value: primary.video_count?.toString() || '0', 
            trend: 'Stable', 
            icon: '🎥' 
          },
          { 
            label: 'Engagement', 
            value: primary.engagement_rate != null ? `${primary.engagement_rate}%` : 'N/A', 
            trend: primary.engagement_rate > 5 ? '+High' : 'Normal', 
            icon: '📈' 
          },
        ];
        set({ stats, insights: MOCK_INSIGHTS, isLoading: false });
      } else {
        set({ stats: MOCK_DASHBOARD_STATS, insights: MOCK_INSIGHTS, isLoading: false });
      }
    } catch (err: any) {
      console.error('Dashboard fetch failed:', err);
      set({ stats: MOCK_DASHBOARD_STATS, insights: MOCK_INSIGHTS, isLoading: false });
    }
  },
}));

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
