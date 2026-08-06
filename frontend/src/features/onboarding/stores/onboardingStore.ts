import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { ProfileMaturity } from '../components/MaturityBadge';

export interface AnalysisStatus {
  connected: boolean;
  sync_status: string;
  profile_maturity: ProfileMaturity;
  message: string;
  detected_niches: string[];
  run_analysis: boolean;
  video_count?: number;
}

interface OnboardingState {
  step: number;
  niche: string[];
  format: 'long-form' | 'shorts' | 'hybrid' | null;
  frequency: string | null;
  tone: string | null;
  isYoutubeConnected: boolean;
  country: string | null;
  customNiche: string | null;
  profileMaturity: ProfileMaturity;
  analysisStatus: AnalysisStatus | null;
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
    profile_maturity?: ProfileMaturity;
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
  fetchAnalysisStatus: () => Promise<void>;
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
      profileMaturity: 'new',
      analysisStatus: null,
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
          const { data } = await api.get('/channels/me');
          const ch = data.data?.channel;
          const connected = Boolean(data.data?.connected && ch);
          if (connected && ch) {
            const maturity: ProfileMaturity = ch.profile_maturity || 'new';
            set({
              connectedChannel: {
                id: ch.id,
                youtube_channel_id: ch.youtube_channel_id,
                name: ch.name,
                handle: ch.handle,
                thumbnail: ch.thumbnail_url,
                subscriber_count: ch.subscriber_count || 0,
                video_count: ch.video_count || 0,
                view_count: ch.view_count || 0,
                niches: ch.niches || [],
                profile_maturity: maturity,
              },
              isYoutubeConnected: true,
              profileMaturity: maturity,
              niche:
                get().niche.length === 0 && maturity !== 'new' && ch.niches?.length
                  ? ch.niches.slice(0, 3)
                  : get().niche,
            });
          } else {
            set({ isYoutubeConnected: false, connectedChannel: null, profileMaturity: 'new' });
          }
        } catch {
          set({ isYoutubeConnected: false, connectedChannel: null });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchAnalysisStatus: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get('/channels/me/analysis-status');
          const status = data.data as AnalysisStatus;
          set({
            analysisStatus: status,
            profileMaturity: status.profile_maturity || 'new',
          });
        } catch {
          set({
            analysisStatus: {
              connected: false,
              sync_status: 'pending',
              profile_maturity: 'new',
              message: 'Connect YouTube to enable channel analysis.',
              detected_niches: [],
              run_analysis: false,
            },
          });
        } finally {
          set({ isLoading: false });
        }
      },

      completeOnboarding: async () => {
        const { niche, customNiche, format, frequency, tone, country } = get();

        const finalNiches = [...niche.filter((n) => n !== 'Other')];
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
          if (data.data) {
            useAuthStore.getState().setUser(data.data);
          }
          set({ isLoading: false });
        } catch (e: unknown) {
          const err = e as { response?: { data?: { error?: { message?: string } } } };
          set({
            isLoading: false,
            error: err.response?.data?.error?.message || 'Failed to complete onboarding',
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
          customNiche: null,
          profileMaturity: 'new',
          analysisStatus: null,
          connectedChannel: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
