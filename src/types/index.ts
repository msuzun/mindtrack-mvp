export type Category = 'memory' | 'cognitive' | 'spiritual';
export type CategoryTag = 'focus' | 'personal' | 'work' | 'routine';
export type PriorityLevel = 0 | 1 | 2;
export type GoalStatus = 'active' | 'completed' | 'archived';
export type RoutineFrequency = 'daily' | 'specific_days' | 'interval';
export type TrainingSessionType = 'memory' | 'cognitive' | 'mindfulness' | 'free_focus';

export type Goal = {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: GoalStatus;
  createdAt: string;
};

export type Routine = {
  id: string;
  goalId: string | null;
  title: string;
  frequencyType: RoutineFrequency;
  daysOfWeek: number[];
  targetTime: string | null;
  intervalDays: number;
  isActive: boolean;
  createdAt: string;
};

export type TaskInstance = {
  id: string;
  routineId: string | null;
  goalId: string | null;
  goalTitle: string | null;
  title: string;
  scheduledDate: string;
  isCompleted: boolean;
  completedAt: string | null;
  categoryTag: CategoryTag | null;
  priorityLevel: PriorityLevel;
  description: string | null;
  category: Category;
  targetMinutes: number;
  sortOrder: number;
};

export type Task = TaskInstance & {
  date: string;
  completed: boolean;
};

export type TrainingSession = {
  id: string;
  taskInstanceId: string | null;
  sessionType: TrainingSessionType;
  totalItems: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
  durationSeconds: number;
  accuracyRate: number | null;
  rating: number | null;
  notes: string | null;
  createdAt: string;
};

export type CreateTrainingSessionInput = Omit<TrainingSession, 'id' | 'accuracyRate' | 'createdAt'>;

export type GoalOverview = Goal & {
  progress: number;
  completedTasks: number;
  totalTasks: number;
  routines: Routine[];
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
