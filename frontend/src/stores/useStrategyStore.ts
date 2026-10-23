import { create } from 'zustand';
import { api } from '../lib/api';
import { SSE_CHAT_URL } from '../lib/config';

export interface AgentStep {
  tool: string;
  label: string;
  summary: string;
  status: 'running' | 'done';
  duration_ms?: number;
}

export interface AgentCard {
  card_type: 'trend' | 'video' | 'connector';
  payload: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    steps?: AgentStep[];
    cards?: AgentCard[];
    tools_used?: any[];
    provider?: string;
    model?: string;
  };
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

  // Connected integrations available to copilot reasoning
  connectedConnectors: string[];
  connectConnector: (connector: string) => void;
  disconnectConnector: (connector: string) => void;
  isConnectorConnected: (connector: string) => boolean;
  activeConnectors: string[];
  toggleConnector: (connector: string) => void;
  setConnectors: (connectors: string[]) => void;

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
  // Connectors are opt-in: a plain chat message must not trigger live lookups.
  connectedConnectors: ['web'],
  activeConnectors: ['web'],

  connectConnector: (connector: string) => {
    set((state) => {
      if (state.connectedConnectors.includes(connector)) return state;
      const next = [...state.connectedConnectors, connector];
      return { connectedConnectors: next, activeConnectors: next };
    });
  },

  disconnectConnector: (connector: string) => {
    set((state) => {
      const next = state.connectedConnectors.filter((c) => c !== connector);
      return { connectedConnectors: next, activeConnectors: next };
    });
  },

  isConnectorConnected: (connector: string) => {
    return get().connectedConnectors.includes(connector);
  },

  toggleConnector: (connector: string) => {
    set((state) => {
      const exists = state.activeConnectors.includes(connector);
      return {
        activeConnectors: exists
          ? state.activeConnectors.filter((c) => c !== connector)
          : [...state.activeConnectors, connector],
      };
    });
  },

  setConnectors: (connectors: string[]) => {
    set({ activeConnectors: [...connectors] });
  },

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
      const rawMessages: any[] = data.data || [];
      const messages: ChatMessage[] = rawMessages.map((m) => {
        // The API returns the message metadata under `metadata`
        // (see backend strategy_service.get_session_messages).
        const meta = m.metadata ?? m.metadata_json ?? {};
        return {
          id: m.id,
          role: m.role,
          content: m.content || '',
          metadata: {
            steps: meta.tools_used?.map((t: any) => ({
              tool: t.tool || 'tool',
              label: t.label || 'Research Step',
              summary: t.summary || 'Queried live intelligence',
              status: 'done' as const,
              duration_ms: t.duration_ms || 0,
            })) || [],
            cards: meta.cards || [],
            tools_used: meta.tools_used || [],
            provider: meta.provider,
            model: meta.model,
          },
          created_at: m.created_at,
        };
      });
      set({ messages, isLoadingMessages: false });
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
    } catch {
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
    const tempUserMsgId = `user-${Date.now()}`;
    const tempAssistantMsgId = `asst-${Date.now()}`;

    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    const tempAssistantMsg: ChatMessage = {
      id: tempAssistantMsgId,
      role: 'assistant',
      content: '',
      metadata: { steps: [], cards: [] },
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, tempUserMsg, tempAssistantMsg],
      isSending: true,
      error: null,
    }));

    try {
      const token = localStorage.getItem('ciq_access_token');
      const streamUrl = SSE_CHAT_URL;

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: trimmed,
          session_id: targetSessionId || undefined,
          active_connectors: get().activeConnectors,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.detail?.message || errJson?.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream available from server.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let activeSessionId = targetSessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data:')) continue;
          const jsonStr = trimmedLine.replace(/^data:\s*/, '').trim();
          if (!jsonStr) continue;

          try {
            const ev = JSON.parse(jsonStr);

            if (ev.type === 'session' && ev.session_id) {
              activeSessionId = ev.session_id;
              set((state) => {
                const exists = state.sessions.some((s) => s.id === ev.session_id);
                const updatedSessions = exists
                  ? state.sessions
                  : [{ id: ev.session_id, title: trimmed.slice(0, 40), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...state.sessions];
                return {
                  currentSessionId: ev.session_id,
                  sessions: updatedSessions,
                };
              });
            } else if (ev.type === 'step') {
              set((state) => {
                const msgs = [...state.messages];
                const lastIdx = msgs.length - 1;
                if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                  const existingSteps = msgs[lastIdx].metadata?.steps || [];
                  const stepIdx = existingSteps.findIndex((s) => s.tool === ev.tool && s.summary === ev.summary);
                  let updatedSteps: AgentStep[];
                  if (stepIdx >= 0) {
                    updatedSteps = existingSteps.map((s, idx) =>
                      idx === stepIdx ? { ...s, status: ev.status, duration_ms: ev.duration_ms } : s
                    );
                  } else {
                    updatedSteps = [...existingSteps, {
                      tool: ev.tool,
                      label: ev.label,
                      summary: ev.summary,
                      status: ev.status,
                      duration_ms: ev.duration_ms,
                    }];
                  }
                  msgs[lastIdx] = {
                    ...msgs[lastIdx],
                    metadata: {
                      ...msgs[lastIdx].metadata,
                      steps: updatedSteps,
                    },
                  };
                }
                return { messages: msgs };
              });
            } else if (ev.type === 'card') {
              set((state) => {
                const msgs = [...state.messages];
                const lastIdx = msgs.length - 1;
                if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                  const existingCards = msgs[lastIdx].metadata?.cards || [];
                  msgs[lastIdx] = {
                    ...msgs[lastIdx],
                    metadata: {
                      ...msgs[lastIdx].metadata,
                      cards: [...existingCards, { card_type: ev.card_type, payload: ev.payload }],
                    },
                  };
                }
                return { messages: msgs };
              });
            } else if (ev.type === 'token') {
              set((state) => {
                const msgs = [...state.messages];
                const lastIdx = msgs.length - 1;
                if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                  msgs[lastIdx] = {
                    ...msgs[lastIdx],
                    content: (msgs[lastIdx].content || '') + ev.delta,
                  };
                }
                return { messages: msgs };
              });
            } else if (ev.type === 'done') {
              if (ev.message_id) {
                set((state) => {
                  const msgs = [...state.messages];
                  const lastIdx = msgs.length - 1;
                  if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                    msgs[lastIdx] = { ...msgs[lastIdx], id: ev.message_id };
                  }
                  return { messages: msgs, isSending: false };
                });
              }
            }
          } catch {
            // ignore non-json line
          }
        }
      }

      set({ isSending: false });
      return activeSessionId || undefined;
    } catch (err: any) {
      set((state) => {
        const msgs = state.messages.map((m) => {
          if (m.id === tempAssistantMsgId && !m.content.trim()) {
            return {
              ...m,
              content: `⚠️ Strategy generation encountered an issue: ${err.message || 'Connection closed'}. Please try again.`,
            };
          }
          return m;
        });
        return {
          messages: msgs,
          isSending: false,
          error: err.message || 'Failed to stream response',
        };
      });
      return undefined;
    }
  },

  clearCurrentSession: () => {
    set({ currentSessionId: null, messages: [], error: null });
  },
}));
