import { create } from 'zustand';
import { api } from '../lib/api';

interface AnalyticsState {
  retentionData: any;
  trafficSources: any[];
  audienceDemographics: any;
  loading: boolean;
  fetchAnalytics: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  retentionData: {
    intro: 88,
    value: 72,
    outro: 45
  },
  trafficSources: [
    { source: 'Direct Sync', value: 45 },
    { source: 'External Referrals', value: 28 },
    { source: 'Organic Discovery', value: 17 },
    { source: 'Paid Amplification', value: 10 }
  ],
  audienceDemographics: {
    ageGroups: [
      { group: '18-24', percentage: 35 },
      { group: '25-34', percentage: 42 },
      { group: '35+', percentage: 23 }
    ],
    locations: [
      { country: 'United States', percentage: 55 },
      { country: 'United Kingdom', percentage: 15 },
      { country: 'Germany', percentage: 10 }
    ]
  },
  loading: false,
  fetchAnalytics: async () => {
    set({ loading: true });
    try {
      const { data: channelData } = await api.get('/channels');
      const channels = channelData.data?.channels || [];
      const primary = channels.find((c: any) => c.is_primary) || channels[0];
      
      if (!primary?.id) {
        set({ loading: false });
        return;
      }

      const { data } = await api.get(`/analytics/dashboard?channel_id=${primary.id}`);
      const payload = data.data;

      console.log("Analytics Payload: ",payload);

      if (payload) {
        set({
           retentionData: payload.retentionData,
           trafficSources: payload.trafficSources,
           audienceDemographics: payload.audienceDemographics,
        });
      }
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    } finally {
      set({ loading: false });
    }
  },
}));
