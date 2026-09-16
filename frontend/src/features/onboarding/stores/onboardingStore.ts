import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { ProfileMaturity } from '../components/MaturityBadge';


interface OnboardingState {
  step: number;
  channelName: string;
  channelHandle: string;
  subscriberCount: number;
  niche: string[];
  format: 'long-form' | 'shorts' | 'hybrid' | null;
  frequency: string | null;
  tone: string | null;
  country: string | null;
  customNiche: string | null;
  profileMaturity: ProfileMaturity;
  isLoading: boolean;
  error: string | null;

  nextStep: () => void;
  prevStep: () => void;
  setChannelName: (name: string) => void;
  setChannelHandle: (handle: string) => void;
  setSubscriberCount: (count: number) => void;
  setNiche: (niche: string[]) => void;
  setCustomNiche: (niche: string | null) => void;
  setFormat: (format: 'long-form' | 'shorts' | 'hybrid') => void;
  setFrequency: (frequency: string) => void;
  setTone: (tone: string) => void;
  setCountry: (country: string) => void;
  setStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 1,
      channelName: '',
      channelHandle: '',
      subscriberCount: 0,
      niche: [],
      format: null,
      frequency: null,
      tone: null,
      country: null,
      customNiche: null,
      profileMaturity: 'new',
      isLoading: false,
      error: null,

      nextStep: () => set((state) => ({ step: state.step + 1 })),
      prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
      setChannelName: (channelName) => set({ channelName }),
      setChannelHandle: (channelHandle) => set({ channelHandle }),
      setSubscriberCount: (subscriberCount) => set({ subscriberCount }),
      setNiche: (niche) => set({ niche }),
      setCustomNiche: (customNiche) => set({ customNiche }),
      setFormat: (format) => set({ format }),
      setFrequency: (frequency) => set({ frequency }),
      setTone: (tone) => set({ tone }),
      setCountry: (country) => set({ country }),
      setStep: (step: number) => set({ step }),

      completeOnboarding: async () => {
        const {
          channelName,
          channelHandle,
          subscriberCount,
          niche,
          customNiche,
          format,
          frequency,
          tone,
          country,
        } = get();

        const finalNiches = [...niche.filter((n) => n !== 'Other')];
        if (niche.includes('Other') && customNiche) {
          finalNiches.push(customNiche);
        }

        set({ isLoading: true, error: null });
        try {
          const { data } = await api.patch('/auth/onboarding/complete', {
            channel_name: channelName || undefined,
            handle: channelHandle || undefined,
            subscriber_count: subscriberCount || 0,
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
          channelName: '',
          channelHandle: '',
          subscriberCount: 0,
          niche: [],
          format: null,
          frequency: null,
          tone: null,
          country: null,
          customNiche: null,
          profileMaturity: 'new',
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
