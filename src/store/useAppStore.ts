import { create } from 'zustand';
import { Task } from '../types';
import {
  ensureTasksForDate,
  getTasksForDate,
  setTaskCompleted,
} from '../db/database';
import { toLocalDateKey } from '../utils/date';

type Tab = 'today' | 'plan' | 'progress' | 'about';

type AppState = {
  tab: Tab;
  selectedDate: string;
  tasks: Task[];
  loading: boolean;
  setTab: (tab: Tab) => void;
  setSelectedDate: (date: string) => void;
  loadDay: (date?: string) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  tab: 'today',
  selectedDate: toLocalDateKey(),
  tasks: [],
  loading: false,

  setTab: (tab) => set({ tab }),

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    void get().loadDay(date);
  },

  loadDay: async (date = get().selectedDate) => {
    set({ loading: true, selectedDate: date });
    await ensureTasksForDate(date);
    const tasks = await getTasksForDate(date);
    set({ tasks, loading: false });
  },

  toggleTask: async (task) => {
    await setTaskCompleted(task.id, !task.completed);
    await get().loadDay(task.date);
  },
}));
