import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

type Retriable = InternalAxiosRequestConfig & { _retry?: boolean };

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
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    const refresh = localStorage.getItem('ciq_refresh_token');
    if (!refresh) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      const { data } = await axios.post<{ data: { access_token: string; refresh_token: string } }>(
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
      return api(original);
    } catch {
      localStorage.removeItem('ciq_access_token');
      localStorage.removeItem('ciq_refresh_token');
      return Promise.reject(error);
    }
  }
);
