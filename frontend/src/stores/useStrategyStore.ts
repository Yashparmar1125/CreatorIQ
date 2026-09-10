import { create } from 'zustand';
import { api } from '../lib/api';
import { normalizeStrategyBrief, sanitizeStrategyTopic, type StrategyBrief } from '../lib/strategyTopic';

interface StrategyState {
  brief: StrategyBrief | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  generateBrief: (topic: string, goal?: string) => Promise<void>;
  clearBrief: () => void;
}

export const useStrategyStore = create<StrategyState>((set) => ({
  brief: null,
  sessionId: null,
  isLoading: false,
  error: null,
  clearBrief: () => set({ brief: null, sessionId: null, error: null }),
  generateBrief: async (topic: string, goal?: string) => {
    const cleaned = sanitizeStrategyTopic(topic);
    if (!cleaned) {
      set({ error: 'Please enter a valid topic.' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const payload: { topic: string; goal?: string } = { topic: cleaned };
      if (goal) {
        payload.goal = goal;
      }
      const { data } = await api.post('/strategy/generate-brief', payload);
      const rawBrief = data?.data?.brief ?? data?.brief;
      const sessionId = (data?.data?.session_id ?? data?.session_id ?? null) as string | null;
      const brief = normalizeStrategyBrief(rawBrief, topic);

      if (!brief.titles.length && !brief.strategy_insight) {
        set({
          error: 'Strategy generation returned empty results. Please try again.',
          isLoading: false,
        });
        return;
      }

      if ((rawBrief as { generated_via?: string })?.generated_via === 'fallback') {
        console.warn('Strategy brief served from fallback (AI rate-limited or unavailable).');
      }

      set({ brief, sessionId, isLoading: false, error: null });
    } catch (error) {
      console.error('Failed to generate brief:', error);
      set({
        error: 'Could not generate strategy. Check your connection and try again.',
        isLoading: false,
      });
    }
  },
}));
