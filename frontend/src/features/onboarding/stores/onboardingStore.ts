import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAuthStore';

interface OnboardingState {
  step: number;
  niche: string[];
  format: 'long-form' | 'shorts' | 'hybrid' | null;
  frequency: string | null;
  tone: string | null;
  isYoutubeConnected: boolean;
  country: string | null;
  customNiche: string | null;
  connectedChannel: { 
    id: string;
    youtube_channel_id: string;
    name: string; 
    handle: string | null;
    thumbnail: string | null;
    subscriber_count: number;
    video_count: number;
    view_count: number;
    niches: string[];
  } | null;
  isLoading: boolean;
  error: string | null;
  
  nextStep: () => void;
  prevStep: () => void;
  setNiche: (niche: string[]) => void;
  setCustomNiche: (niche: string | null) => void;
  setFormat: (format: 'long-form' | 'shorts' | 'hybrid') => void;
  setFrequency: (frequency: string) => void;
  setTone: (tone: string) => void;
  setYoutubeConnected: (connected: boolean) => void;
  setCountry: (country: string) => void;
  setStep: (step: number) => void;
  fetchChannels: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 1,
      niche: [],
      format: null,
      frequency: null,
      tone: null,
      isYoutubeConnected: false,
      country: null,
      customNiche: null,
      connectedChannel: null,
      isLoading: false,
      error: null,

      nextStep: () => set((state) => ({ step: state.step + 1 })),
      prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
      setNiche: (niche) => set({ niche }),
      setCustomNiche: (customNiche) => set({ customNiche }),
      setFormat: (format) => set({ format }),
      setFrequency: (frequency) => set({ frequency }),
      setTone: (tone) => set({ tone }),
      setYoutubeConnected: (isYoutubeConnected) => set({ isYoutubeConnected }),
      setCountry: (country) => set({ country }),
      setStep: (step: number) => set({ step }),
      
      fetchChannels: async () => {
        set({ isLoading: true, error: null });
        try {
          // Pointing to internal channels list
          const { data } = await api.get('/internal/channels/me');
          const channels = data.data?.channels || [];
          if (channels.length > 0) {
            const primary = channels[0];
            set({ 
              connectedChannel: { 
                id: primary.id,
                youtube_channel_id: primary.youtube_channel_id,
                name: primary.name, 
                handle: primary.handle,
                thumbnail: primary.thumbnail_url,
                subscriber_count: primary.subscriber_count || 0,
                video_count: primary.video_count || 0,
                view_count: primary.view_count || 0,
                niches: primary.niches || []
              }, 
              isYoutubeConnected: true,
              niche: get().niche.length === 0 ? primary.niches || [] : get().niche
            });
          } else {
            set({ isYoutubeConnected: false, connectedChannel: null });
          }
        } catch (e: any) {
          console.error('Failed to fetch channels:', e);
          set({ isYoutubeConnected: false });
        } finally {
          set({ isLoading: false });
        }
      },

      completeOnboarding: async () => {
        const { niche, customNiche, format, frequency, tone, country } = get();
        
        // Combine predefined niches with custom one if "Other" was selected
        const finalNiches = [...niche.filter(n => n !== 'Other')];
        if (niche.includes('Other') && customNiche) {
          finalNiches.push(customNiche);
        }

        set({ isLoading: true, error: null });
        try {
          const { data } = await api.patch('/auth/onboarding/complete', {
            niche: finalNiches,
            primary_format: format,
            posting_frequency: frequency,
            channel_tone: tone,
            country,
          });
          // Update auth user data
          if (data.data) {
            useAuthStore.getState().setUser(data.data);
          }
          set({ isLoading: false });
        } catch (e: any) {
          set({ 
            isLoading: false, 
            error: e.response?.data?.error?.message || 'Failed to complete onboarding' 
          });
          throw e;
        }
      },

      reset: () => {
        localStorage.removeItem('onboarding-storage');
        set({ 
          step: 1, 
          niche: [], 
          format: null, 
          frequency: null, 
          tone: null, 
          isYoutubeConnected: false,
          country: null,
          connectedChannel: null,
          isLoading: false,
          error: null 
        });
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
