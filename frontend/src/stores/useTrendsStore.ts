import { create } from 'zustand';
import { api } from '../lib/api';

export interface Trend {
  id: string;
  topic: string;
  velocity: string;
  volume: string;
  niches: string[];
  saved?: boolean;
  archetype: string;
  growth_tip: string;
  saturation_index: number;
  stability_score: number;
  adjacent_topics: string[];
}

interface TrendsState {
  trends: Trend[];
  isLoading: boolean;
  error: string | null;
  fetchTrends: () => Promise<void>;
  toggleSaveTrend: (id: string) => Promise<void>;
}

export const useTrendsStore = create<TrendsState>((set, get) => ({
  trends: [],
  isLoading: false,
  error: null,
  fetchTrends: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/trends');
      // The API returns { data: { trends: [...] }, meta: { ... } }
      set({ trends: data.data.trends, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  toggleSaveTrend: async (trendId: string) => {
    const trend = get().trends.find(t => t.id === trendId);
    if (!trend) return;

    const isSaving = !trend.saved;
    const method = isSaving ? 'post' : 'delete';
    
    try {
      await api[method](`/trends/${trendId}/save`);
      // Update local state optimistically
      set({
        trends: get().trends.map(t => 
          t.id === trendId ? { ...t, saved: isSaving } : t
        )
      });
    } catch (err: any) {
      console.error('Failed to toggle save:', err);
    }
  },
}));
