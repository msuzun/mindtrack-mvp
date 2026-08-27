import { useEffect, useMemo, useState } from 'react';
import { SmartPlanningEngine } from '../services/SmartPlanningEngine';
import { Category, Task } from '../types';

export type TimeBudget = null | 15 | 30 | 45;
export type CapacityMode = 'minimum' | 'normal' | 'intensive';

function hourDistance(a: number, b: number) {
  const direct = Math.abs(a - b);
  return Math.min(direct, 24 - direct);
}

export function useTimeBudgetFilter(tasks: Task[], budget: TimeBudget) {
  const [productiveHours, setProductiveHours] = useState<Partial<Record<Category, number>>>({});
  useEffect(() => { void SmartPlanningEngine.getProductiveHours().then(setProductiveHours); }, [tasks.length]);

  return useMemo(() => {
    const nowHour = new Date().getHours();
    const ranked = [...tasks].sort((a, b) => {
      const score = (task: Task) => {
        const preferred = productiveHours[task.category];
        const timeFit = preferred == null ? 0 : Math.max(0, 30 - hourDistance(nowHour, preferred) * 3);
        return task.priorityLevel * 300 + (task.goalId ? 45 : 0) + (task.routineId ? 20 : 0) + timeFit - Math.max(0, task.targetMinutes - 15);
      };
      return score(b) - score(a) || a.sortOrder - b.sortOrder;
    });
    const incompleteCount = tasks.filter((task) => !task.completed).length;
    const capacityMode: CapacityMode = incompleteCount <= 2 ? 'minimum' : incompleteCount <= 4 ? 'normal' : 'intensive';
    if (budget == null) return { visibleTasks: ranked, hiddenCount: 0, capacityMode };

    let remaining = budget;
    const visibleTasks: Task[] = [];
    for (const task of ranked.filter((item) => !item.completed)) {
      const duration = Math.max(1, task.targetMinutes || 1);
      if (duration <= remaining) { visibleTasks.push(task); remaining -= duration; }
    }
    return { visibleTasks, hiddenCount: incompleteCount - visibleTasks.length, capacityMode };
  }, [budget, productiveHours, tasks]);
}
