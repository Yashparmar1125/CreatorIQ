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
  supported_formats: string[];
  tvs_score: number;
  opportunity_score?: number;
  prediction_confidence: number;
  status: string;
  lifecycle?: string;
  why_trending?: string;
  key_indicator?: string;
  niche_fit_score?: number;
  geo_relevance?: number;
  headline?: string;
  content_angle?: string;
  raw_topic?: string;
  video_url?: string;
  channel_name?: string;
  is_youtube_video?: boolean;
  sources?: string[];
  ai_enriched?: boolean;
  title_ideas?: string[];
  description?: string;
}

export interface ChannelContext {
  name: string | null;
  thumbnail_url: string | null;
  niches: string[];
  tone: string;
  subscriber_count: number;
}

export interface GeoContext {
  source: string;
  badge: string | null;
  audience_weights?: Record<string, number>;
}

export interface CreditsInfo {
  plan: string;
  limit: number | null;
  unlimited?: boolean;
  used?: number;
  remaining?: number;
}

export interface FeedHistoryEntry {
  feed_id: string;
  created_at: string;
  item_count: number;
  is_first_feed: boolean;
  credits_used: number;
  topics: string[];
  preview_topics: string[];
  is_current: boolean;
}

function applyFeedPayload(payload: Record<string, unknown>) {
  return {
    trends: (payload.trends as Trend[]) ?? [],
    channelContext: (payload.channel as ChannelContext) ?? null,
    geoContext: (payload.geo as GeoContext) ?? null,
    credits: (payload.credits as CreditsInfo) ?? null,
    feedId: (payload.feed_id as string) ?? null,
    snapshotAt: (payload.snapshot_at as string) ?? null,
    isPersonalized: Boolean(payload.personalized ?? true),
    aiEnriched: Boolean(payload.ai_enriched),
    isHistorical: Boolean(payload.is_historical),
    isCurrentFeed: payload.is_current !== false,
  };
}

function extractError(err: unknown): string {
  const e = err as { response?: { data?: { detail?: { message?: string }; message?: string } }; message?: string };
  return (
    e.response?.data?.detail?.message ??
    e.response?.data?.message ??
    e.message ??
    'Something went wrong'
  );
}

interface TrendsState {
  trends: Trend[];
  isLoading: boolean;
  isRefreshing: boolean;
  isHistoryLoading: boolean;
  error: string | null;
  emptyReason: string | null;
  channelContext: ChannelContext | null;
  geoContext: GeoContext | null;
  credits: CreditsInfo | null;
  feedId: string | null;
  snapshotAt: string | null;
  isPersonalized: boolean;
  aiEnriched: boolean;
  isHistorical: boolean;
  isCurrentFeed: boolean;
  feedHistory: FeedHistoryEntry[];
  activeFormatFilter: 'all' | 'long_form' | 'shorts';
  trendDetail: Trend | null;
  isDetailLoading: boolean;
  detailError: string | null;
  fetchTrends: (query?: string) => Promise<void>;
  refreshFeed: () => Promise<void>;
  fetchFeedHistory: () => Promise<void>;
  loadHistoricalFeed: (feedId: string) => Promise<void>;
  loadCurrentFeed: () => Promise<void>;
  fetchTrendDetail: (trendId: string) => Promise<void>;
  clearTrendDetail: () => void;
  toggleSaveTrend: (id: string) => Promise<void>;
  setFormatFilter: (filter: 'all' | 'long_form' | 'shorts') => void;
}

export const useTrendsStore = create<TrendsState>((set, get) => ({
  trends: [],
  isLoading: false,
  isRefreshing: false,
  isHistoryLoading: false,
  error: null,
  emptyReason: null,
  channelContext: null,
  geoContext: null,
  credits: null,
  feedId: null,
  snapshotAt: null,
  isPersonalized: false,
  aiEnriched: false,
  isHistorical: false,
  isCurrentFeed: true,
  feedHistory: [],
  activeFormatFilter: 'all',
  trendDetail: null,
  isDetailLoading: false,
  detailError: null,

  setFormatFilter: (filter) => set({ activeFormatFilter: filter }),

  fetchTrends: async (query?: string) => {
    if (query) {
      set({
        isLoading: true,
        error: null,
        trends: [],
        channelContext: null,
        geoContext: null,
        credits: null,
        isPersonalized: false,
        isHistorical: false,
        isCurrentFeed: true,
        emptyReason: null,
      });
    } else {
      set({ isLoading: true, error: null, emptyReason: null, isHistorical: false, isCurrentFeed: true });
    }
    try {
      const url = query ? `/trends?q=${encodeURIComponent(query.trim())}` : '/trends';
      const { data } = await api.get(url);
      const payload = data.data as Record<string, unknown>;
      set({ ...applyFeedPayload(payload), emptyReason: (payload.empty_reason as string) ?? null, isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  refreshFeed: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const { data } = await api.post('/trends/refresh');
      const payload = data.data as Record<string, unknown>;
      set({ ...applyFeedPayload(payload), isRefreshing: false, isHistorical: false, isCurrentFeed: true });
      get().fetchFeedHistory();
    } catch (err) {
      set({ error: extractError(err), isRefreshing: false });
    }
  },

  fetchFeedHistory: async () => {
    set({ isHistoryLoading: true });
    try {
      const { data } = await api.get('/trends/history?limit=20');
      set({ feedHistory: data.data?.feeds ?? [], isHistoryLoading: false });
    } catch {
      set({ isHistoryLoading: false });
    }
  },

  loadHistoricalFeed: async (feedId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/trends/history/${feedId}`);
      const payload = data.data as Record<string, unknown>;
      set({ ...applyFeedPayload(payload), isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  loadCurrentFeed: async () => {
    await get().fetchTrends();
  },

  fetchTrendDetail: async (trendId: string) => {
    set({ isDetailLoading: true, detailError: null, trendDetail: null });
    try {
      const { data } = await api.get(`/trends/${trendId}`);
      set({ trendDetail: data.data as Trend, isDetailLoading: false });
    } catch (err) {
      set({ detailError: extractError(err), isDetailLoading: false });
    }
  },

  clearTrendDetail: () => set({ trendDetail: null, detailError: null, isDetailLoading: false }),

  toggleSaveTrend: async (trendId: string) => {
    const trend = get().trends.find((t) => t.id === trendId) ?? get().trendDetail;
    if (!trend) return;

    const isSaving = !trend.saved;

    set({
      trends: get().trends.map((t) => (t.id === trendId ? { ...t, saved: isSaving } : t)),
      trendDetail: get().trendDetail?.id === trendId ? { ...get().trendDetail!, saved: isSaving } : get().trendDetail,
    });

    try {
      if (isSaving) {
        await api.post(`/trends/${trendId}/save`, { trend_data: trend });
      } else {
        await api.delete(`/trends/${trendId}/save`);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      set({
        trends: get().trends.map((t) => (t.id === trendId ? { ...t, saved: !isSaving } : t)),
        trendDetail:
          get().trendDetail?.id === trendId ? { ...get().trendDetail!, saved: !isSaving } : get().trendDetail,
      });
    }
  },
}));
