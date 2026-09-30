import { create } from 'zustand';
import { api } from '../lib/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface StrategyState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;

  fetchSessions: () => Promise<ChatSession[]>;
  selectSession: (sessionId: string) => Promise<void>;
  createSession: (title?: string) => Promise<string>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (prompt: string, sessionId?: string) => Promise<string | undefined>;
  clearCurrentSession: () => void;
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  isLoadingSessions: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoadingSessions: true, error: null });
    try {
      const { data } = await api.get('/strategy/sessions');
      const sessions = data.data || [];
      set({ sessions, isLoadingSessions: false });
      return sessions;
    } catch (e: any) {
      set({ isLoadingSessions: false, error: e.response?.data?.error?.message || 'Failed to load sessions' });
      return [];
    }
  },

  selectSession: async (sessionId: string) => {
    set({ currentSessionId: sessionId, isLoadingMessages: true, error: null });
    try {
      const { data } = await api.get(`/strategy/sessions/${sessionId}`);
      set({ messages: data.data || [], isLoadingMessages: false });
    } catch (e: any) {
      set({ isLoadingMessages: false, error: e.response?.data?.error?.message || 'Failed to load messages' });
    }
  },

  createSession: async (title = 'New Strategy Chat') => {
    try {
      const { data } = await api.post('/strategy/sessions', { title });
      const newSession = data.data as ChatSession;
      set((state) => ({
        sessions: [newSession, ...state.sessions],
        currentSessionId: newSession.id,
        messages: [],
      }));
      return newSession.id;
    } catch (e: any) {
      const fallbackId = `temp-${Date.now()}`;
      set({ currentSessionId: null, messages: [] });
      return fallbackId;
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      await api.delete(`/strategy/sessions/${sessionId}`);
      set((state) => {
        const remaining = state.sessions.filter((s) => s.id !== sessionId);
        const isCurrent = state.currentSessionId === sessionId;
        return {
          sessions: remaining,
          currentSessionId: isCurrent ? (remaining[0]?.id || null) : state.currentSessionId,
          messages: isCurrent ? [] : state.messages,
        };
      });
      if (get().currentSessionId) {
        await get().selectSession(get().currentSessionId!);
      }
    } catch (e: any) {
      set({ error: e.response?.data?.error?.message || 'Failed to delete session' });
    }
  },

  sendMessage: async (prompt: string, explicitSessionId?: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const targetSessionId = explicitSessionId || get().currentSessionId;
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, tempUserMsg],
      isSending: true,
      error: null,
    }));

    try {
      const { data } = await api.post('/strategy/chat', {
        prompt: trimmed,
        session_id: targetSessionId || undefined,
      });

      const res = data.data;
      const session = res.session as ChatSession;
      const assistantMsg = res.message as ChatMessage;
      const userMsg = res.user_message as ChatMessage;

      set((state) => {
        // Update or add session in session list
        const existingIdx = state.sessions.findIndex((s) => s.id === session.id);
        let updatedSessions: ChatSession[];
        if (existingIdx >= 0) {
          updatedSessions = state.sessions.map((s, idx) => (idx === existingIdx ? session : s));
        } else {
          updatedSessions = [session, ...state.sessions];
        }

        // Replace temp user message with real one & append assistant response
        const filtered = state.messages.filter((m) => m.id !== tempUserMsg.id);
        return {
          sessions: updatedSessions,
          currentSessionId: session.id,
          messages: [...filtered, userMsg, assistantMsg],
          isSending: false,
        };
      });
      return session.id;
    } catch (e: any) {
      set({
        isSending: false,
        error: e.response?.data?.error?.message || e.response?.data?.detail?.message || 'Failed to generate strategy.',
      });
      return undefined;
    }
  },

  clearCurrentSession: () => {
    set({ currentSessionId: null, messages: [], error: null });
  },
}));
