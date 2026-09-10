import { create } from 'zustand';
import { api } from '../lib/api';

export interface RetentionData {
  intro: number;
  value: number;
  outro: number;
}

export interface TrafficSource {
  source: string;
  value: number;
}

export interface DemographicsGroup {
  group: string;
  percentage: number;
}

export interface LocationGroup {
  country: string;
  percentage: number;
}

export interface AudienceDemographics {
  ageGroups: DemographicsGroup[];
  locations: LocationGroup[];
}

export interface AnalyticsState {
  retentionData: RetentionData;
  trafficSources: TrafficSource[];
  audienceDemographics: AudienceDemographics;
  loading: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
}

const DEFAULT_RETENTION: RetentionData = {
  intro: 88,
  value: 72,
  outro: 45,
};

const DEFAULT_TRAFFIC_SOURCES: TrafficSource[] = [
  { source: 'Direct Sync', value: 45 },
  { source: 'External Referrals', value: 28 },
  { source: 'Organic Discovery', value: 17 },
  { source: 'Paid Amplification', value: 10 },
];

const DEFAULT_AUDIENCE: AudienceDemographics = {
  ageGroups: [
    { group: '18-24', percentage: 35 },
    { group: '25-34', percentage: 42 },
    { group: '35+', percentage: 23 },
  ],
  locations: [
    { country: 'United States', percentage: 55 },
    { country: 'United Kingdom', percentage: 15 },
    { country: 'Germany', percentage: 10 },
  ],
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  retentionData: DEFAULT_RETENTION,
  trafficSources: DEFAULT_TRAFFIC_SOURCES,
  audienceDemographics: DEFAULT_AUDIENCE,
  loading: false,
  isSyncing: false,
  lastSynced: null,
  error: null,
  fetchAnalytics: async () => {
    set((state) => ({
      loading: !state.retentionData,
      isSyncing: true,
      error: null,
    }));

    try {
      const { data: channelData } = await api.get('/channels');
      const channels = channelData?.data?.channels || [];
      const primary = channels.find((c: { is_primary?: boolean; id?: string }) => c.is_primary) || channels[0];

      if (!primary?.id) {
        set({ isSyncing: false, loading: false, lastSynced: new Date() });
        return;
      }

      const { data } = await api.get(`/analytics/dashboard?channel_id=${primary.id}`);
      const payload = data?.data;

      if (payload) {
        set({
          retentionData: payload.retentionData ?? DEFAULT_RETENTION,
          trafficSources:
            Array.isArray(payload.trafficSources) && payload.trafficSources.length > 0
              ? payload.trafficSources
              : DEFAULT_TRAFFIC_SOURCES,
          audienceDemographics: payload.audienceDemographics ?? DEFAULT_AUDIENCE,
          lastSynced: new Date(),
          error: null,
        });
      } else {
        set({ lastSynced: new Date() });
      }
    } catch (e: unknown) {
      console.error('Failed to fetch analytics', e);
      const message = e instanceof Error ? e.message : 'Failed to fetch analytics';
      set({ error: message, lastSynced: new Date() });
    } finally {
      set({ loading: false, isSyncing: false });
    }
  },
}));
