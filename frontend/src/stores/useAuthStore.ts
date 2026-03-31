import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { api } from '../lib/api';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  plan_tier: string;
  avatar_url?: string | null;
  onboarding_completed?: boolean;
  is_google_authenticated?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser | null) => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  register: (full_name: string, email: string, password: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  startGoogleOAuth: () => Promise<void>;
  applyHashTokens: (hash: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

function syncLocalTokens(access: string | null, refresh: string | null) {
  if (access) localStorage.setItem('ciq_access_token', access);
  else localStorage.removeItem('ciq_access_token');
  if (refresh) localStorage.setItem('ciq_refresh_token', refresh);
  else localStorage.removeItem('ciq_refresh_token');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setTokens: (access, refresh) => {
        syncLocalTokens(access, refresh);
        set({
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: !!access,
        });
      },

      setUser: (user) => set({ user }),

      clearError: () => set({ error: null }),

      loginWithPassword: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post<{
            data: { user: AuthUser; access_token: string; refresh_token: string };
          }>('/auth/login', { email, password });
          const d = data.data;
          get().setTokens(d.access_token, d.refresh_token);
          set({ user: d.user, isAuthenticated: true, isLoading: false });
        } catch (e: unknown) {
          const msg = axios.isAxiosError(e)
            ? String((e.response?.data as { error?: { message?: string } })?.error?.message || 'Login failed')
            : 'Login failed';
          set({ error: msg, isLoading: false });
          throw e;
        }
      },

      register: async (full_name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post<{
            data: { user: AuthUser; access_token: string; refresh_token: string };
          }>('/auth/register', { full_name, email, password });
          const d = data.data;
          get().setTokens(d.access_token, d.refresh_token);
          set({ user: d.user, isAuthenticated: true, isLoading: false });
        } catch (e: unknown) {
          const msg = axios.isAxiosError(e)
            ? String((e.response?.data as { error?: { message?: string } })?.error?.message || 'Registration failed')
            : 'Registration failed';
          set({ error: msg, isLoading: false });
          throw e;
        }
      },

      fetchMe: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        try {
          const { data } = await api.get<{ data: { user: AuthUser } }>('/auth/me');
          set({ user: data.data.user });
        } catch {
          get().logout();
        }
      },

      startGoogleOAuth: async () => {
        set({ error: null });
        try {
          const { data } = await axios.get<{ data: { url: string } }>(`${baseURL}/auth/google/oauth-url`);
          const url = data.data?.url;
          if (!url) {
            set({ error: 'Could not start Google sign-in' });
            throw new Error('no_oauth_url');
          }
          window.location.href = url;
        } catch (e: unknown) {
          if (axios.isAxiosError(e)) {
            const msg = String(
              (e.response?.data as { error?: { message?: string } })?.error?.message || 'Could not start Google sign-in'
            );
            set({ error: msg });
          } else {
            set({ error: 'Could not start Google sign-in' });
          }
          throw e;
        }
      },

      applyHashTokens: async (hash: string) => {
        const h = hash.startsWith('#') ? hash.slice(1) : hash;
        const params = new URLSearchParams(h);
        const access = params.get('access_token');
        const refresh = params.get('refresh_token');
        if (!access || !refresh) {
          set({ error: 'Missing tokens in callback' });
          throw new Error('missing_tokens');
        }
        get().setTokens(access, refresh);
        set({ isAuthenticated: true });
        await get().fetchMe();
      },

      logout: () => {
        syncLocalTokens(null, null);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
        localStorage.removeItem('creatoriq-auth-storage');
      },
    }),
    {
      name: 'creatoriq-auth-storage',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          syncLocalTokens(state.accessToken, state.refreshToken);
        }
      },
    }
  )
);
