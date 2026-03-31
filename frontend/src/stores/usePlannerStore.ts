import { create } from 'zustand';
import { MOCK_PLANNER_EVENTS } from '../lib/mock-data';

interface PlannerState {
  events: typeof MOCK_PLANNER_EVENTS;
  addEvent: (event: any) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  events: MOCK_PLANNER_EVENTS,
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
}));
