import * as SQLite from 'expo-sqlite';
import {
  ActivityDay, Category, CategoryTag, DailyCompletionStats, Goal, GoalOverview,
  GoalStatus, PeriodStats, PriorityLevel, Routine, RoutineFrequency, Task,
  TrainingSession,
} from '../types';

const dbPromise = SQLite.openDatabaseAsync('mindtrack.db');
let initialization: Promise<void> | null = null;

const defaultRoutines: Array<{ title: string; category: Category; description: string; minutes: number }> = [
  { title: 'Aktif Hatırlama', category: 'memory', description: 'Önceki öğrendiklerinden bir konuyu kaynağa bakmadan hatırla ve kısa not çıkar.', minutes: 20 },
  { title: 'Memory Palace', category: 'memory', description: '20 öğeyi bir mekân rotasına yerleştir ve sonunda geri çağır.', minutes: 20 },
  { title: 'Tekrar', category: 'memory', description: 'Dünkü hafıza çalışmalarından en az birini tekrar et.', minutes: 20 },
  { title: 'Mantık Problemleri', category: 'cognitive', description: 'En az 5 mantık/örüntü sorusu çöz.', minutes: 20 },
  { title: 'Sayısal / Algoritmik Düşünme', category: 'cognitive', description: 'Zihinden hesaplama, algoritma veya matematik problemi çöz.', minutes: 20 },
  { title: 'Uzamsal / Sözel Egzersiz', category: 'cognitive', description: 'Mental rotation, analoji veya sözel akıl yürütme çalış.', minutes: 20 },
  { title: 'Nefes ve Dikkat', category: 'spiritual', description: 'Nefese odaklan; dikkatin dağıldığında yargılamadan geri dön.', minutes: 20 },
  { title: 'Tefekkür / Sessizlik', category: 'spiritual', description: 'Sessizce düşün, gözlemle ve gününü değerlendir.', minutes: 20 },
  { title: 'Dua', category: 'spiritual', description: 'Kişisel dua ve manevi uygulama zamanı.', minutes: 20 },
];

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function tableExists(db: SQLite.SQLiteDatabase, name: string) {
  return Boolean(await db.getFirstAsync(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`, name));
}

async function ensureColumn(db: SQLite.SQLiteDatabase, table: string, column: string, definition: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function migrateV1(db: SQLite.SQLiteDatabase) {
  if (!(await tableExists(db, 'tasks'))) return;
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(tasks)');
  const names = new Set(columns.map((column) => column.name));
  const categoryTag = names.has('category_tag') ? 'category_tag' : 'NULL';
  const priority = names.has('priority_level') ? 'priority_level' : '0';

  await db.execAsync(`
    INSERT OR IGNORE INTO task_instances (
      id, routine_id, goal_id, title, scheduled_date, is_completed, completed_at,
      category_tag, priority_level, description, category, target_minutes, sort_order
    )
    SELECT
      'v1-' || id, NULL, NULL, title, date, completed, completed_at,
      ${categoryTag}, ${priority}, description, category, target_minutes, sort_order
    FROM tasks;
  `);

  if (await tableExists(db, 'focus_sessions')) {
    await db.execAsync(`
      ALTER TABLE focus_sessions RENAME TO focus_sessions_v1_archive;
      CREATE TABLE focus_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_instance_id TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        completed_at TEXT NOT NULL,
        FOREIGN KEY (task_instance_id) REFERENCES task_instances(id) ON DELETE CASCADE
      );
      INSERT INTO focus_sessions (id, task_instance_id, duration_minutes, completed_at)
      SELECT id, 'v1-' || task_id, duration_minutes, completed_at
      FROM focus_sessions_v1_archive;
    `);
  }

  await db.execAsync('ALTER TABLE tasks RENAME TO tasks_v1_archive;');
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES ('schema_version', '2.1.0')
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
}

async function initializeDatabase() {
  const db = await dbPromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_date TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY NOT NULL,
      goal_id TEXT,
      title TEXT NOT NULL,
      frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily','specific_days','interval')),
      days_of_week TEXT NOT NULL DEFAULT '[]',
      target_time TEXT,
      interval_days INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'cognitive',
      target_minutes INTEGER NOT NULL DEFAULT 20,
      category_tag TEXT,
      priority_level INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS task_instances (
      id TEXT PRIMARY KEY NOT NULL,
      routine_id TEXT,
      goal_id TEXT,
      title TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      category_tag TEXT,
      priority_level INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'cognitive',
      target_minutes INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL,
      UNIQUE (routine_id, scheduled_date)
    );

    CREATE INDEX IF NOT EXISTS idx_task_instances_date
    ON task_instances(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_task_instances_date_completed
    ON task_instances(scheduled_date, is_completed);
    CREATE INDEX IF NOT EXISTS idx_task_instances_goal
    ON task_instances(goal_id, is_completed);
    CREATE INDEX IF NOT EXISTS idx_routines_active
    ON routines(is_active, goal_id);
  `);

  await db.withTransactionAsync(async () => migrateV1(db));

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_instance_id TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (task_instance_id) REFERENCES task_instances(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_focus_sessions_instance
    ON focus_sessions(task_instance_id, completed_at);

    CREATE TABLE IF NOT EXISTS training_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      task_instance_id TEXT,
      session_type TEXT NOT NULL CHECK (session_type IN ('memory','cognitive','mindfulness','free_focus')),
      total_items INTEGER,
      correct_count INTEGER,
      incorrect_count INTEGER,
      duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
      accuracy_rate REAL,
      rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_instance_id) REFERENCES task_instances(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_training_sessions_task_created
    ON training_sessions(task_instance_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_training_sessions_type_created
    ON training_sessions(session_type, created_at);

    CREATE TABLE IF NOT EXISTS smart_suggestions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('difficulty_increase','difficulty_decrease','reschedule','load_balance')),
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','dismissed')),
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_smart_suggestions_status_created
    ON smart_suggestions(status, created_at);
  `);

  await ensureColumn(db, 'routines', 'default_item_count', 'INTEGER NOT NULL DEFAULT 30');
  await ensureColumn(db, 'routines', 'estimated_duration_minutes', 'INTEGER NOT NULL DEFAULT 20');

  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES ('schema_version', '2.4.0')
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );

  const now = new Date().toISOString();
  for (let index = 0; index < defaultRoutines.length; index++) {
    const item = defaultRoutines[index]!;
    await db.runAsync(
      `INSERT OR IGNORE INTO routines
       (id, goal_id, title, frequency_type, days_of_week, is_active, created_at,
        description, category, target_minutes, sort_order)
       VALUES (?, NULL, ?, 'daily', '[]', 1, ?, ?, ?, ?, ?)`,
      `routine-default-${index}`, item.title, now, item.description, item.category, item.minutes, index
    ).catch(async () => {
      // Compatibility for databases created before sort_order was introduced on routines.
      const routineColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(routines)');
      if (!routineColumns.some((column) => column.name === 'sort_order')) {
        await db.execAsync('ALTER TABLE routines ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
      }
      await db.runAsync(
        `INSERT OR IGNORE INTO routines
         (id, title, frequency_type, days_of_week, is_active, created_at, description, category, target_minutes, sort_order)
         VALUES (?, ?, 'daily', '[]', 1, ?, ?, ?, ?, ?)`,
        `routine-default-${index}`, item.title, now, item.description, item.category, item.minutes, index
      );
    });
  }
}

export function initDatabase() {
  initialization ??= initializeDatabase();
  return initialization;
}

export type ReminderSettings = { enabled: boolean; hour: number; minute: number };
const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { enabled: false, hour: 9, minute: 0 };

export async function getReminderSettings(): Promise<ReminderSettings> {
  await initDatabase();
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'daily_reminder'`);
  if (!row) return DEFAULT_REMINDER_SETTINGS;
  try {
    const value = JSON.parse(row.value) as Partial<ReminderSettings>;
    return {
      enabled: value.enabled === true,
      hour: Number.isInteger(value.hour) && value.hour! >= 0 && value.hour! <= 23 ? value.hour! : 9,
      minute: Number.isInteger(value.minute) && value.minute! >= 0 && value.minute! <= 59 ? value.minute! : 0,
    };
  } catch { return DEFAULT_REMINDER_SETTINGS; }
}

export async function saveReminderSettings(settings: ReminderSettings) {
  await setAppSetting('daily_reminder', JSON.stringify(settings));
}

export async function getAppSetting(key: string): Promise<string | null> {
  await initDatabase();
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string) {
  await initDatabase();
  const db = await dbPromise;
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`, key, value
  );
}

type TaskRow = {
  id: string; routine_id: string | null; goal_id: string | null; goal_title: string | null;
  title: string; scheduled_date: string; is_completed: number; completed_at: string | null;
  category_tag: CategoryTag | null; priority_level: PriorityLevel; description: string | null;
  category: Category; target_minutes: number; sort_order: number;
};

function mapTask(row: TaskRow): Task {
  return {
    id: row.id, routineId: row.routine_id, goalId: row.goal_id, goalTitle: row.goal_title,
    title: row.title, scheduledDate: row.scheduled_date, date: row.scheduled_date,
    isCompleted: row.is_completed === 1, completed: row.is_completed === 1,
    completedAt: row.completed_at, categoryTag: row.category_tag, priorityLevel: row.priority_level,
    description: row.description, category: row.category, targetMinutes: row.target_minutes, sortOrder: row.sort_order,
  };
}

export async function getTasksForDate(date: string): Promise<Task[]> {
  await initDatabase();
  const db = await dbPromise;
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT ti.*, g.title AS goal_title
     FROM task_instances ti LEFT JOIN goals g ON g.id = ti.goal_id
     WHERE ti.scheduled_date = ?
     ORDER BY ti.is_completed, ti.priority_level DESC, ti.sort_order, ti.title`, date
  );
  return rows.map(mapTask);
}

export async function getIncompleteTaskCount(date: string) {
  await initDatabase();
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM task_instances WHERE scheduled_date = ? AND is_completed = 0', date
  );
  return row?.count ?? 0;
}

export async function setTaskCompleted(id: string, completed: boolean) {
  await initDatabase();
  const db = await dbPromise;
  await db.runAsync(
    'UPDATE task_instances SET is_completed = ?, completed_at = ? WHERE id = ?',
    completed ? 1 : 0, completed ? new Date().toISOString() : null, id
  );
}

export async function updateTaskCustomization(id: string, categoryTag: CategoryTag | null, priorityLevel: PriorityLevel) {
  await initDatabase();
  const db = await dbPromise;
  await db.runAsync('UPDATE task_instances SET category_tag = ?, priority_level = ? WHERE id = ?', categoryTag, priorityLevel, id);
}

export async function saveFocusSession(taskId: string, durationSeconds: number) {
  await initDatabase();
  const db = await dbPromise;
  await db.runAsync(
    'INSERT INTO focus_sessions (task_instance_id, duration_minutes, completed_at) VALUES (?, ?, ?)',
    taskId, Math.max(1, Math.round(durationSeconds / 60)), new Date().toISOString()
  );
}

export async function insertTrainingSession(session: TrainingSession) {
  await initDatabase();
  const db = await dbPromise;
  await db.runAsync(
    `INSERT INTO training_sessions (
      id, task_instance_id, session_type, total_items, correct_count, incorrect_count,
      duration_seconds, accuracy_rate, rating, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    session.id, session.taskInstanceId, session.sessionType, session.totalItems,
    session.correctCount, session.incorrectCount, session.durationSeconds,
    session.accuracyRate, session.rating, session.notes, session.createdAt
  );
}

export async function getActiveRoutines(): Promise<Routine[]> {
  await initDatabase();
  const db = await dbPromise;
  const rows = await db.getAllAsync<any>('SELECT * FROM routines WHERE is_active = 1 ORDER BY sort_order, created_at');
  return rows.map(mapRoutine);
}

function mapRoutine(row: any): Routine {
  let days: number[] = [];
  try { days = JSON.parse(row.days_of_week ?? '[]'); } catch { days = []; }
  return {
    id: row.id, goalId: row.goal_id, title: row.title, frequencyType: row.frequency_type,
    daysOfWeek: days, targetTime: row.target_time, intervalDays: row.interval_days ?? 1,
    isActive: row.is_active === 1, createdAt: row.created_at,
    defaultItemCount: row.default_item_count ?? 30,
    estimatedDurationMinutes: row.estimated_duration_minutes ?? row.target_minutes ?? 20,
  };
}

export async function insertRoutineTask(routine: Routine, date: string) {
  await initDatabase();
  const db = await dbPromise;
  const source = await db.getFirstAsync<any>('SELECT * FROM routines WHERE id = ?', routine.id);
  if (!source) return;
  await db.runAsync(
    `INSERT OR IGNORE INTO task_instances
     (id, routine_id, goal_id, title, scheduled_date, category_tag, priority_level,
      description, category, target_minutes, sort_order)
     SELECT ?, id, goal_id, title, ?, category_tag, priority_level,
            description, category, target_minutes, sort_order
     FROM routines
     WHERE id = ? AND NOT EXISTS (
       SELECT 1 FROM task_instances WHERE scheduled_date = ? AND (routine_id = ? OR title = ?)
     )`,
    newId('task'), date, routine.id, date, routine.id, routine.title
  );
}

export async function createGoal(input: {
  title: string; description?: string; targetDate?: string | null;
  routineTitle?: string; frequencyType?: RoutineFrequency; daysOfWeek?: number[];
}) {
  await initDatabase();
  const db = await dbPromise;
  const goalId = newId('goal');
  const createdAt = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO goals (id, title, description, target_date, status, created_at)
       VALUES (?, ?, ?, ?, 'active', ?)`, goalId, input.title.trim(), input.description?.trim() || null, input.targetDate ?? null, createdAt
    );
    if (input.routineTitle?.trim()) {
      await db.runAsync(
        `INSERT INTO routines
         (id, goal_id, title, frequency_type, days_of_week, is_active, created_at, category_tag)
         VALUES (?, ?, ?, ?, ?, 1, ?, 'routine')`,
        newId('routine'), goalId, input.routineTitle.trim(), input.frequencyType ?? 'daily',
        JSON.stringify(input.daysOfWeek ?? []), createdAt
      );
    }
  });
  return goalId;
}

export async function getGoalsOverview(): Promise<GoalOverview[]> {
  await initDatabase();
  const db = await dbPromise;
  const goalRows = await db.getAllAsync<any>(
    `SELECT g.*,
       COUNT(ti.id) AS total_tasks,
       COALESCE(SUM(ti.is_completed), 0) AS completed_tasks
     FROM goals g LEFT JOIN task_instances ti ON ti.goal_id = g.id
     WHERE g.status != 'archived'
     GROUP BY g.id ORDER BY g.created_at DESC`
  );
  const routineRows = await db.getAllAsync<any>('SELECT * FROM routines WHERE goal_id IS NOT NULL AND is_active = 1 ORDER BY created_at');
  return goalRows.map((row): GoalOverview => {
    const total = Number(row.total_tasks ?? 0);
    const completed = Number(row.completed_tasks ?? 0);
    return {
      id: row.id, title: row.title, description: row.description, targetDate: row.target_date,
      status: row.status as GoalStatus, createdAt: row.created_at,
      totalTasks: total, completedTasks: completed,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      routines: routineRows.filter((routine) => routine.goal_id === row.id).map(mapRoutine),
    };
  });
}

export async function getStats(start: string, end: string): Promise<PeriodStats> {
  await initDatabase();
  const db = await dbPromise;
  const row = await db.getFirstAsync<any>(
    `SELECT COUNT(*) AS total, COALESCE(SUM(is_completed), 0) AS completed,
      COALESCE(SUM(target_minutes), 0) AS planned_minutes,
      COALESCE(SUM(CASE WHEN is_completed = 1 THEN target_minutes ELSE 0 END), 0) AS completed_minutes
     FROM task_instances WHERE scheduled_date BETWEEN ? AND ?`, start, end
  );
  const total = Number(row?.total ?? 0); const completed = Number(row?.completed ?? 0);
  return { total, completed, completionRate: total ? Math.round(completed / total * 100) : 0, plannedMinutes: row?.planned_minutes ?? 0, completedMinutes: row?.completed_minutes ?? 0 };
}

export async function getWeeklyStats(start: string, end: string): Promise<DailyCompletionStats[]> {
  await initDatabase();
  const db = await dbPromise;
  const rows = await db.getAllAsync<any>(
    `SELECT scheduled_date AS date, COUNT(*) AS total, COALESCE(SUM(is_completed), 0) AS completed
     FROM task_instances WHERE scheduled_date BETWEEN ? AND ? GROUP BY scheduled_date ORDER BY scheduled_date`, start, end
  );
  return rows.map((row) => ({ date: row.date, total: row.total, completed: row.completed, completionRate: row.total ? Math.round(row.completed / row.total * 100) : 0 }));
}

export async function getActivityHeatmapData(start: string, end: string): Promise<ActivityDay[]> {
  await initDatabase();
  const db = await dbPromise;
  return db.getAllAsync<ActivityDay>(
    `SELECT date(completed_at, 'localtime') AS date, COUNT(*) AS completed
     FROM task_instances WHERE completed_at IS NOT NULL
       AND date(completed_at, 'localtime') BETWEEN ? AND ?
     GROUP BY date(completed_at, 'localtime') ORDER BY date(completed_at, 'localtime')`, start, end
  );
}
