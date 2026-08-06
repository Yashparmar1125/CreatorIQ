import { create } from 'zustand';
import { api } from '../lib/api';
import { normalizeStrategyBrief, sanitizeStrategyTopic, type StrategyBrief } from '../lib/strategyTopic';

interface StrategyState {
  brief: StrategyBrief | null;
  isLoading: boolean;
  error: string | null;
  generateBrief: (topic: string) => Promise<void>;
  clearBrief: () => void;
}

export const useStrategyStore = create<StrategyState>((set) => ({
  brief: null,
  isLoading: false,
  error: null,
  clearBrief: () => set({ brief: null, error: null }),
  generateBrief: async (topic: string) => {
    const cleaned = sanitizeStrategyTopic(topic);
    if (!cleaned) {
      set({ error: 'Please enter a valid topic.' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/strategy/generate-brief', { topic: cleaned });
      const payload = data?.data?.brief ?? data?.brief;
      const brief = normalizeStrategyBrief(payload, topic);

      if (!brief.titles.length && !brief.strategy_insight) {
        set({
          error: 'Strategy generation returned empty results. Please try again.',
          isLoading: false,
        });
        return;
      }

      if ((payload as { generated_via?: string })?.generated_via === 'fallback') {
        console.warn('Strategy brief served from fallback (AI rate-limited or unavailable).');
      }

      set({ brief, isLoading: false, error: null });
    } catch (error) {
      console.error('Failed to generate brief:', error);
      set({
        error: 'Could not generate strategy. Check your connection and try again.',
        isLoading: false,
      });
    }
  },
}));
