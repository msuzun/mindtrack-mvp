export type Category = 'memory' | 'cognitive' | 'spiritual';
export type CategoryTag = 'focus' | 'personal' | 'work' | 'routine';
export type PriorityLevel = 0 | 1 | 2;
export type GoalStatus = 'active' | 'completed' | 'archived';
export type RoutineFrequency = 'daily' | 'specific_days' | 'interval';
export type TrainingSessionType = 'memory' | 'cognitive' | 'mindfulness' | 'free_focus';
export type SmartSuggestionType = 'difficulty_increase' | 'difficulty_decrease' | 'reschedule' | 'load_balance';
export type SmartSuggestionStatus = 'pending' | 'accepted' | 'dismissed';
export type NotificationTone = 'gentle' | 'balanced' | 'energetic';
export type NotificationCategory = 'memory' | 'cognitive' | 'general';
export type ProgramCategory = 'memory' | 'focus' | 'logic' | 'mindfulness';
export type ProgramLevel = 'beginner' | 'intermediate' | 'advanced';
export type ProgramEnrollmentStatus = 'active' | 'paused' | 'completed';

export type ProgramRoutineTemplate = {
  id: string; title: string; description: string; category: Category;
  daysOfWeek: number[]; targetMinutes: number; itemCount?: number;
};
export type ProgramWeekTemplate = { week: number; title: string; description: string; routines: ProgramRoutineTemplate[] };
export type ProgramDefinition = {
  id: string; title: string; description: string; category: ProgramCategory;
  durationWeeks: number; level: ProgramLevel; curriculum: ProgramWeekTemplate[];
};
export type UserEnrolledProgram = {
  id: string; programId: string; goalId: string; startDate: string; currentWeek: number;
  status: ProgramEnrollmentStatus; pausedAt: string | null; completedAt: string | null;
  title: string; description: string; category: ProgramCategory; durationWeeks: number; level: ProgramLevel;
  weekCompleted: number; weekTotal: number;
};
export type ProgramGraduationSummary = {
  enrollmentId: string; title: string; totalItems: number; focusMinutes: number;
  accuracyChange: number | null; badge: string;
};
export type PersonalRecordType = 'max_items' | 'peak_accuracy' | 'longest_focus' | 'best_streak_week';
export type PersonalRecord = { id: string; recordType: PersonalRecordType; value: number; achievedAt: string; sessionId: string | null };
export type ReviewPeriodType = 'weekly' | 'monthly';
export type ReviewMetrics = {
  periodStart: string; periodEnd: string; consistencyRate: number; focusMinutes: number; completedSessions: number;
  peakMoment: string | null; currentAccuracy: number | null; previousAccuracy: number | null;
  ninetyDayAccuracy: number | null; accuracyDelta: number | null;
};
export type BenchmarkType = 'memory_capacity' | 'logical_speed';
export type Benchmark = { id: string; benchmarkType: BenchmarkType; score: number; baselineComparisonDelta: number; takenAt: string };

export type NotificationSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  tone: NotificationTone;
  quietHoursStart: string;
  quietHoursEnd: string;
  autoReduceFrequency: boolean;
  ignoredCount: number;
  enabledCategories: NotificationCategory[];
  lastAppOpenedAt: string | null;
};

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
  defaultItemCount: number;
  estimatedDurationMinutes: number;
  programEnrollmentId?: string | null;
  programWeek?: number | null;
  programStartDate?: string | null;
  programStatus?: ProgramEnrollmentStatus | null;
};

export type SmartSuggestion = {
  id: string;
  type: SmartSuggestionType;
  payload: Record<string, unknown>;
  status: SmartSuggestionStatus;
  createdAt: string;
  message: string;
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
