import { create } from 'zustand';
import { api } from '../lib/api';

export interface PopulationVideo {
  video_id?: string;
  title?: string;
  channel_title?: string;
  subscriber_count?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  reach_ratio?: number;
  interaction_density?: number;
  semantic_score?: number;
  is_outlier?: boolean;
  published_at?: string;
  url?: string;
}

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
  vector_similarity?: number;
  headline?: string;
  content_angle?: string;
  video_concept?: string;
  why_predicted?: string;
  action_plan?: string;
  raw_topic?: string;
  video_url?: string;
  channel_name?: string;
  is_youtube_video?: boolean;
  sources?: string[];
  ai_enriched?: boolean;
  title_ideas?: string[];
  description?: string;
  creator_tier?: 'small' | 'medium' | 'big';
  is_momentum_outlier?: boolean;
  // Teammate's canonical daily signal pipeline metrics
  reach_ratio_median?: number;
  interaction_density_median?: number;
  population_size?: number;
  small_channel_count?: number;
  medium_channel_count?: number;
  big_channel_count?: number;
  outlier_streak?: number;
  semantic_score_mean?: number;
  population_videos?: PopulationVideo[];
  filter_audit?: {
    total_fetched?: number;
    passed_concept_gate?: number;
    passed_semantic_gate?: number;
    final_qualified?: number;
  };
}

export interface HorizonForecast {
  target_date: string;
  forecast_score: number;
  lower_bound: number;
  upper_bound: number;
  direction: string;
  change_pct: number;
}

export interface TrajectoryPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface LightGBMFeatureImportance {
  feature: string;
  importance: number;
  value: number;
}

export interface TrendForecastData {
  topic: string;
  origin_date: string;
  current_score: number;
  test_prob?: number;
  viral_probability_pct?: number;
  top_features?: LightGBMFeatureImportance[];
  model_specs?: {
    algorithm: string;
    n_estimators: number;
    learning_rate: number;
    feature_count: number;
    imputer: string;
    class_balancing: string;
  };
  horizons: {
    '1_week'?: HorizonForecast;
    '1_month'?: HorizonForecast;
    '3_months'?: HorizonForecast;
  };
  trajectory: TrajectoryPoint[];
  metrics: {
    avg_velocity: number;
    avg_acceleration: number;
    uncertainty: 'low' | 'moderate' | 'high';
  };
  model_used: string;
  data_source?: 'real_history' | 'synthetic_prior_fallback' | 'heuristic_fallback';
  observations_count?: number;
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

function applyFeedPayload(payload: Record<string, unknown>, savedIds?: Set<string>) {
  const rawTrends = ((payload.trends as Trend[]) ?? []).map((t) => ({
    ...t,
    saved: savedIds ? savedIds.has(t.id) || Boolean(t.saved) : Boolean(t.saved),
  }));
  return {
    trends: rawTrends,
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
  savedTrends: Trend[];
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
  activeFormatFilter: 'all' | 'long_form' | 'shorts' | 'saved';
  trendDetail: Trend | null;
  isDetailLoading: boolean;
  detailError: string | null;
  trendForecast: TrendForecastData | null;
  isForecastLoading: boolean;
  forecastError: string | null;
  fetchTrends: (query?: string) => Promise<void>;
  fetchSavedTrends: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  fetchFeedHistory: () => Promise<void>;
  loadHistoricalFeed: (feedId: string) => Promise<void>;
  loadCurrentFeed: () => Promise<void>;
  fetchTrendDetail: (trendId: string) => Promise<void>;
  fetchTrendForecast: (trendId: string) => Promise<void>;
  clearTrendDetail: () => void;
  toggleSaveTrend: (id: string) => Promise<void>;
  setFormatFilter: (filter: 'all' | 'long_form' | 'shorts' | 'saved') => void;
}

export const useTrendsStore = create<TrendsState>((set, get) => ({
  trends: [],
  savedTrends: [],
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
  trendForecast: null,
  isForecastLoading: false,
  forecastError: null,

  setFormatFilter: (filter) => {
    set({ activeFormatFilter: filter });
    if (filter === 'saved') {
      void get().fetchSavedTrends();
    }
  },

  fetchSavedTrends: async () => {
    try {
      const { data } = await api.get('/trends/saved');
      const savedList = ((data.data?.trends as Trend[]) ?? []).map((t) => ({ ...t, saved: true }));
      const savedSet = new Set(savedList.map((t) => t.id));
      set({
        savedTrends: savedList,
        trends: get().trends.map((t) => ({ ...t, saved: savedSet.has(t.id) || Boolean(t.saved) })),
      });
    } catch {
      // ignore if unauthenticated or offline
    }
  },

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
      const [feedRes, savedRes] = await Promise.all([
        api.get(url),
        api.get('/trends/saved').catch(() => null),
      ]);
      const savedList = ((savedRes?.data?.data?.trends as Trend[]) ?? []).map((t) => ({
        ...t,
        saved: true,
      }));
      const savedIds = new Set(savedList.map((t) => t.id));
      const payload = feedRes.data.data as Record<string, unknown>;
      set({
        ...applyFeedPayload(payload, savedIds),
        savedTrends: savedList,
        emptyReason: (payload.empty_reason as string) ?? null,
        isLoading: false,
      });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  refreshFeed: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const { data } = await api.post('/trends/refresh');
      const payload = data.data as Record<string, unknown>;
      const savedIds = new Set(get().savedTrends.map((t) => t.id));
      set({ ...applyFeedPayload(payload, savedIds), isRefreshing: false, isHistorical: false, isCurrentFeed: true });
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
      const savedIds = new Set(get().savedTrends.map((t) => t.id));
      set({ ...applyFeedPayload(payload, savedIds), isLoading: false });
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
      const detail = data.data as Trend;
      const isSaved = get().savedTrends.some((s) => s.id === trendId) || Boolean(detail.saved);
      set({ trendDetail: { ...detail, saved: isSaved }, isDetailLoading: false });
    } catch (err) {
      set({ detailError: extractError(err), isDetailLoading: false });
    }
  },

  fetchTrendForecast: async (trendId: string) => {
    set({ isForecastLoading: true, forecastError: null });
    try {
      const { data } = await api.get(`/trends/${trendId}/forecast`);
      set({ trendForecast: data.data as TrendForecastData, isForecastLoading: false });
    } catch (err) {
      set({ forecastError: extractError(err), isForecastLoading: false });
    }
  },

  clearTrendDetail: () =>
    set({
      trendDetail: null,
      detailError: null,
      isDetailLoading: false,
      trendForecast: null,
      forecastError: null,
      isForecastLoading: false,
    }),

  toggleSaveTrend: async (trendId: string) => {
    const trend =
      get().trends.find((t) => t.id === trendId) ??
      get().savedTrends.find((t) => t.id === trendId) ??
      get().trendDetail;
    if (!trend) return;

    const isSaving = !trend.saved;
    const updatedTrend = { ...trend, saved: isSaving };

    set({
      trends: get().trends.map((t) => (t.id === trendId ? { ...t, saved: isSaving } : t)),
      savedTrends: isSaving
        ? [updatedTrend, ...get().savedTrends.filter((t) => t.id !== trendId)]
        : get().savedTrends.filter((t) => t.id !== trendId),
      trendDetail: get().trendDetail?.id === trendId ? { ...get().trendDetail!, saved: isSaving } : get().trendDetail,
    });

    try {
      if (isSaving) {
        await api.post(`/trends/${trendId}/save`, { trend_data: updatedTrend });
      } else {
        await api.delete(`/trends/${trendId}/save`);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      set({
        trends: get().trends.map((t) => (t.id === trendId ? { ...t, saved: !isSaving } : t)),
        savedTrends: !isSaving
          ? [trend, ...get().savedTrends.filter((t) => t.id !== trendId)]
          : get().savedTrends.filter((t) => t.id !== trendId),
        trendDetail:
          get().trendDetail?.id === trendId ? { ...get().trendDetail!, saved: !isSaving } : get().trendDetail,
      });
    }
  },
}));
