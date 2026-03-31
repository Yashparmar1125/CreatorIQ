import { create } from 'zustand';

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
    await new Promise(r => setTimeout(r, 1500));
    set({ loading: false });
  },
}));
