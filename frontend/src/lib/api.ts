import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useNotificationStore } from '../stores/useNotificationStore';
import { API_BASE_URL } from './config';

const baseURL = API_BASE_URL;

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

type Retriable = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function handleSessionExpiration(reason?: string) {
  // Clear stored tokens
  localStorage.removeItem('ciq_access_token');
  localStorage.removeItem('ciq_refresh_token');
  localStorage.removeItem('creatoriq-auth-storage');

  try {
    const { useAuthStore } = await import('../stores/useAuthStore');
    useAuthStore.getState().logout();
  } catch {
    // ignore
  }

  useNotificationStore
    .getState()
    .addNotification(
      'error',
      'Session Expired',
      reason || 'Your session has expired. Please sign in again.'
    );

  // If inside the authenticated app, redirect cleanly to /login
  if (
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/app')
  ) {
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ciq_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as Retriable | undefined;

    // Only intercept 401 Unauthorized errors
    if (!original || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // If the call was to the refresh endpoint itself and failed, session is dead
    if (original.url?.includes('/auth/token/refresh')) {
      await handleSessionExpiration();
      return Promise.reject(error);
    }

    // If request was already retried once, don't loop
    if (original._retry) {
      await handleSessionExpiration();
      return Promise.reject(error);
    }

    const refresh = localStorage.getItem('ciq_refresh_token');
    if (!refresh) {
      await handleSessionExpiration();
      return Promise.reject(error);
    }

    // If a refresh is already in-flight from a concurrent request, queue this request
    if (isRefreshing) {
      return new Promise<unknown>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          },
          reject: (err: unknown) => {
            reject(err);
          },
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{
        data: { access_token: string; refresh_token: string };
      }>(
        `${baseURL}/auth/token/refresh`,
        { refresh_token: refresh },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const access = data.data.access_token;
      const nextRefresh = data.data.refresh_token;

      localStorage.setItem('ciq_access_token', access);
      localStorage.setItem('ciq_refresh_token', nextRefresh);

      const { useAuthStore } = await import('../stores/useAuthStore');
      useAuthStore.getState().setTokens(access, nextRefresh);

      original.headers.Authorization = `Bearer ${access}`;
      processQueue(null, access);
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await handleSessionExpiration();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
