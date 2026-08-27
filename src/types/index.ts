export type Category = 'memory' | 'cognitive' | 'spiritual';

export type Task = {
  id: number;
  date: string;
  title: string;
  description: string | null;
  category: Category;
  targetMinutes: number;
  sortOrder: number;
  completed: boolean;
  completedAt: string | null;
};

export type DaySummary = {
  date: string;
  total: number;
  completed: number;
  completionRate: number;
  plannedMinutes: number;
  completedMinutes: number;
};

export type PeriodStats = {
  total: number;
  completed: number;
  completionRate: number;
  plannedMinutes: number;
  completedMinutes: number;
};

export type DailyCompletionStats = {
  date: string;
  total: number;
  completed: number;
  completionRate: number;
};

export type ActivityDay = {
  date: string;
  completed: number;
};
