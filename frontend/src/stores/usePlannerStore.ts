import { create } from 'zustand';
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { api } from '../lib/api';
import { MOCK_PLANNER_EVENTS } from '../lib/mock-data';

export type SlotLifecycleStatus =
  | 'not_started'
  | 'scripting'
  | 'recording'
  | 'editing'
  | 'in_progress'
  | 'scripted'
  | 'ready'
  | 'published'
  | 'skipped';

export interface PlannerSlot {
  id: string;
  channel_id: string;
  scheduled_at: string; // ISO-8601 string
  topic: string;
  status: SlotLifecycleStatus;
  notes?: string | null;
  strategy_session_id?: string | null;
  trend_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSlotPayload {
  topic: string;
  scheduled_at: string;
  status?: SlotLifecycleStatus | string;
  strategy_session_id?: string;
  trend_id?: string;
  notes?: string;
}

export interface UpdateSlotPayload {
  topic?: string;
  scheduled_at?: string;
  status?: SlotLifecycleStatus | string;
  notes?: string;
}

export interface PlannerState {
  slots: PlannerSlot[];
  currentDate: Date;
  channelId: string | null;
  isLoading: boolean;
  error: string | null;

  // Primary Actions
  fetchPrimaryChannel: () => Promise<string | null>;
  fetchSlots: (startDate?: string, endDate?: string) => Promise<PlannerSlot[]>;
  createSlot: (payload: CreateSlotPayload) => Promise<PlannerSlot | null>;
  updateSlot: (slotId: string, updates: UpdateSlotPayload) => Promise<PlannerSlot | null>;
  deleteSlot: (slotId: string) => Promise<boolean>;

  // Calendar Navigation
  setCurrentDate: (date: Date) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  clearError: () => void;

  // Legacy Backwards-Compatibility
  events: Array<{ id: string | number; day: number; title: string; type: string }>;
  addEvent: (event: any) => void;
}

const getInitialFallbackSlots = (): PlannerSlot[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return [
    {
      id: 'mock-slot-1',
      channel_id: 'default-channel',
      scheduled_at: new Date(year, month, 2, 14, 0, 0).toISOString(),
      topic: 'React 19 Deep Dive Video Release',
      status: 'published',
      notes: 'Comprehensive breakdown of React 19 features, actions, and compiler.',
    },
    {
      id: 'mock-slot-2',
      channel_id: 'default-channel',
      scheduled_at: new Date(year, month, 8, 16, 30, 0).toISOString(),
      topic: 'Sponsorship Post & Tech Review',
      status: 'ready',
      notes: 'Brand sponsored integration with affiliate links and custom demo.',
    },
    {
      id: 'mock-slot-3',
      channel_id: 'default-channel',
      scheduled_at: new Date(year, month, 15, 11, 0, 0).toISOString(),
      topic: 'AI Video Editing Tools Workflow',
      status: 'editing',
      notes: 'Rough cut complete, working on sound effects, captions, and b-roll.',
    },
    {
      id: 'mock-slot-4',
      channel_id: 'default-channel',
      scheduled_at: new Date(year, month, 22, 10, 0, 0).toISOString(),
      topic: 'Tailwind 4 Best Practices Guide',
      status: 'scripting',
      notes: 'Outlining code snippets and performance comparison benchmarks.',
    },
  ];
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
  slots: getInitialFallbackSlots(),
  currentDate: new Date(),
  channelId: null,
  isLoading: false,
  error: null,
  events: MOCK_PLANNER_EVENTS,

  fetchPrimaryChannel: async () => {
    try {
      const { data } = await api.get('/channels');
      const channels = data?.data?.channels || data?.channels || [];
      const primary = channels.find((c: any) => c.is_primary) || channels[0];
      const channelId = primary?.id || null;
      if (channelId) {
        set({ channelId });
      }
      return channelId;
    } catch (err) {
      console.warn('Failed to fetch primary channel from /channels:', err);
      return get().channelId;
    }
  },

  fetchSlots: async (startDate?: string, endDate?: string) => {
    const { currentDate } = get();
    let { channelId } = get();
    if (!channelId) {
      channelId = await get().fetchPrimaryChannel();
    }

    const start = startDate || format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = endDate || format(endOfMonth(currentDate), 'yyyy-MM-dd');

    if (!channelId) {
      // Channel not yet loaded or offline; preserve existing slots gracefully
      return get().slots;
    }

    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/planner/slots', {
        params: {
          channel_id: channelId,
          start_date: start,
          end_date: end,
        },
      });
      const fetchedSlots: PlannerSlot[] = data?.data?.slots || [];
      set({ slots: fetchedSlots, isLoading: false, error: null });
      return fetchedSlots;
    } catch (err: any) {
      console.warn('GET /planner/slots failed, preserving local state:', err);
      set({
        isLoading: false,
        error: 'Planner service is offline. Showing local calendar slots.',
      });
      return get().slots;
    }
  },

  createSlot: async (payload: CreateSlotPayload) => {
    let { channelId } = get();
    if (!channelId) {
      channelId = await get().fetchPrimaryChannel();
    }
    const effectiveChannelId = channelId || '00000000-0000-0000-0000-000000000001';
    const status = (payload.status as SlotLifecycleStatus) || 'not_started';

    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/planner/slots', {
        channel_id: effectiveChannelId,
        topic: payload.topic,
        scheduled_at: payload.scheduled_at,
        status,
        strategy_session_id: payload.strategy_session_id || null,
        trend_id: payload.trend_id || null,
        notes: payload.notes || null,
      });

      const createdSlot: PlannerSlot = data?.data || {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `slot-${Date.now()}`,
        channel_id: effectiveChannelId,
        scheduled_at: payload.scheduled_at,
        topic: payload.topic,
        status,
        notes: payload.notes || null,
        strategy_session_id: payload.strategy_session_id || null,
        trend_id: payload.trend_id || null,
      };

      set((state) => ({
        slots: [...state.slots.filter((s) => s.id !== createdSlot.id), createdSlot],
        isLoading: false,
        error: null,
      }));
      return createdSlot;
    } catch (err: any) {
      console.warn('POST /planner/slots failed, adding locally:', err);
      const localSlot: PlannerSlot = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `slot-${Date.now()}`,
        channel_id: effectiveChannelId,
        scheduled_at: payload.scheduled_at,
        topic: payload.topic,
        status,
        notes: payload.notes || null,
        strategy_session_id: payload.strategy_session_id || null,
        trend_id: payload.trend_id || null,
      };
      set((state) => ({
        slots: [...state.slots, localSlot],
        isLoading: false,
        error: 'Backend offline: Slot saved to local calendar.',
      }));
      return localSlot;
    }
  },

  updateSlot: async (slotId: string, updates: UpdateSlotPayload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.patch(`/planner/slots/${slotId}`, updates);
      const updatedSlot: PlannerSlot = data?.data;

      set((state) => ({
        slots: state.slots.map((s) => {
          if (s.id === slotId) {
            return updatedSlot || { ...s, ...updates };
          }
          return s;
        }),
        isLoading: false,
        error: null,
      }));
      return updatedSlot || null;
    } catch (err: any) {
      console.warn(`PATCH /planner/slots/${slotId} failed, updating locally:`, err);
      let updated: PlannerSlot | null = null;
      set((state) => ({
        slots: state.slots.map((s) => {
          if (s.id === slotId) {
            updated = {
              ...s,
              ...(updates.topic !== undefined ? { topic: updates.topic } : {}),
              ...(updates.scheduled_at !== undefined ? { scheduled_at: updates.scheduled_at } : {}),
              ...(updates.status !== undefined ? { status: updates.status as SlotLifecycleStatus } : {}),
              ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
            };
            return updated;
          }
          return s;
        }),
        isLoading: false,
        error: 'Backend offline: Slot updated locally.',
      }));
      return updated;
    }
  },

  deleteSlot: async (slotId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/planner/slots/${slotId}`);
      set((state) => ({
        slots: state.slots.filter((s) => s.id !== slotId),
        isLoading: false,
        error: null,
      }));
      return true;
    } catch (err: any) {
      console.warn(`DELETE /planner/slots/${slotId} failed, removing locally:`, err);
      set((state) => ({
        slots: state.slots.filter((s) => s.id !== slotId),
        isLoading: false,
        error: 'Backend offline: Slot removed locally.',
      }));
      return true;
    }
  },

  setCurrentDate: (date: Date) => {
    set({ currentDate: date });
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');
    void get().fetchSlots(start, end);
  },

  prevMonth: () => {
    const current = get().currentDate;
    const newDate = subMonths(current, 1);
    set({ currentDate: newDate });
    const start = format(startOfMonth(newDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(newDate), 'yyyy-MM-dd');
    void get().fetchSlots(start, end);
  },

  nextMonth: () => {
    const current = get().currentDate;
    const newDate = addMonths(current, 1);
    set({ currentDate: newDate });
    const start = format(startOfMonth(newDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(newDate), 'yyyy-MM-dd');
    void get().fetchSlots(start, end);
  },

  clearError: () => set({ error: null }),

  addEvent: (event: any) => {
    const now = get().currentDate;
    const targetDay = typeof event.day === 'number' ? event.day : 1;
    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), targetDay, 12, 0, 0);
    void get().createSlot({
      topic: event.title || 'Video Draft',
      scheduled_at: scheduledDate.toISOString(),
      status: 'not_started',
    });
  },
}));
