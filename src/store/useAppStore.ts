import { create } from 'zustand';
import { Task } from '../types';
import { getTasksForDate, setTaskCompleted } from '../db/database';
import { RoutineSchedulerEngine } from '../services/RoutineSchedulerEngine';
import { toLocalDateKey } from '../utils/date';
import { SmartNotificationScheduler } from '../services/SmartNotificationScheduler';

type Tab = 'today' | 'goals' | 'progress' | 'settings' | 'about';

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
    await RoutineSchedulerEngine.materializeDate(date);
    const tasks = await getTasksForDate(date);
    set({ tasks, loading: false });
  },

  toggleTask: async (task) => {
    await setTaskCompleted(task.id, !task.completed);
    await get().loadDay(task.date);
    await SmartNotificationScheduler.cancelTodayIfComplete();
  },
}));
