import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { toLocalDateKey } from '../utils/date';

export function useTodayTasks() {
  const tasks = useAppStore((state) => state.tasks);
  const loading = useAppStore((state) => state.loading);
  const selectedDate = useAppStore((state) => state.selectedDate);
  const loadDay = useAppStore((state) => state.loadDay);
  const toggleTask = useAppStore((state) => state.toggleTask);
  const lastToday = useRef(toLocalDateKey());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const today = toLocalDateKey();
      if (today !== lastToday.current) {
        lastToday.current = today;
        void loadDay(today);
      }
    });
    return () => subscription.remove();
  }, [loadDay]);

  return { tasks, loading, selectedDate, loadDay, toggleTask };
}
