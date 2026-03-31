import { create } from 'zustand';
import { api } from '../lib/api';

interface StrategyState {
  brief: any | null;
  isLoading: boolean;
  generateBrief: (topic: string) => Promise<void>;
}

export const useStrategyStore = create<StrategyState>((set) => ({
  brief: null,
  isLoading: false,
  generateBrief: async (topic: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/strategy/generate-brief', { topic });
      set({ 
        brief: {
          topic,
          ...data.data.brief
        },
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to generate brief:', error);
      set({ isLoading: false });
    }
  },
}));
