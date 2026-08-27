import * as SQLite from 'expo-sqlite';
import { Category, PeriodStats, Task } from '../types';
import { addDays } from '../utils/date';

const dbPromise = SQLite.openDatabaseAsync('mindtrack.db');

type TaskRow = {
  id: number;
  date: string;
  title: string;
  description: string | null;
  category: Category;
  target_minutes: number;
  sort_order: number;
  completed: number;
  completed_at: string | null;
};

const templates: Array<{
  title: string;
  description: string;
  category: Category;
  targetMinutes: number;
}> = [
  {
    title: 'Aktif Hatırlama',
    description: 'Önceki öğrendiklerinden bir konuyu kaynağa bakmadan hatırla ve kısa not çıkar.',
    category: 'memory',
    targetMinutes: 20,
  },
  {
    title: 'Memory Palace',
    description: '20 öğeyi bir mekân rotasına yerleştir ve sonunda geri çağır.',
    category: 'memory',
    targetMinutes: 20,
  },
  {
    title: 'Tekrar',
    description: 'Dünkü hafıza çalışmalarından en az birini tekrar et.',
    category: 'memory',
    targetMinutes: 20,
  },
  {
    title: 'Mantık Problemleri',
    description: 'En az 5 mantık/örüntü sorusu çöz.',
    category: 'cognitive',
    targetMinutes: 20,
  },
  {
    title: 'Sayısal / Algoritmik Düşünme',
    description: 'Zihinden hesaplama, algoritma veya matematik problemi çöz.',
    category: 'cognitive',
    targetMinutes: 20,
  },
  {
    title: 'Uzamsal / Sözel Egzersiz',
    description: 'Mental rotation, analoji veya sözel akıl yürütme çalış.',
    category: 'cognitive',
    targetMinutes: 20,
  },
  {
    title: 'Nefes ve Dikkat',
    description: 'Nefese odaklan; dikkatin dağıldığında yargılamadan geri dön.',
    category: 'spiritual',
    targetMinutes: 20,
  },
  {
    title: 'Tefekkür / Sessizlik',
    description: 'Sessizce düşün, gözlemle ve gününü değerlendir.',
    category: 'spiritual',
    targetMinutes: 20,
  },
  {
    title: 'Dua',
    description: 'Kişisel dua ve manevi uygulama zamanı.',
    category: 'spiritual',
    targetMinutes: 20,
  },
];

export async function initDatabase() {
  const db = await dbPromise;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL CHECK (category IN ('memory','cognitive','spiritual')),
      target_minutes INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_task_unique_day
    ON tasks(date, title);

    CREATE INDEX IF NOT EXISTS idx_tasks_date
    ON tasks(date);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 9,
  minute: 0,
};

export async function getReminderSettings(): Promise<ReminderSettings> {
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = 'daily_reminder'`
  );

  if (!row) return DEFAULT_REMINDER_SETTINGS;

  try {
    const parsed = JSON.parse(row.value) as Partial<ReminderSettings>;
    return {
      enabled: parsed.enabled === true,
      hour: Number.isInteger(parsed.hour) && parsed.hour! >= 0 && parsed.hour! <= 23
        ? parsed.hour!
        : DEFAULT_REMINDER_SETTINGS.hour,
      minute: Number.isInteger(parsed.minute) && parsed.minute! >= 0 && parsed.minute! <= 59
        ? parsed.minute!
        : DEFAULT_REMINDER_SETTINGS.minute,
    };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export async function saveReminderSettings(settings: ReminderSettings) {
  const db = await dbPromise;
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES ('daily_reminder', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    JSON.stringify(settings)
  );
}

export async function getAppSetting(key: string): Promise<string | null> {
  await initDatabase();
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    key
  );
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string) {
  await initDatabase();
  const db = await dbPromise;
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value
  );
}

export async function getIncompleteTaskCount(date: string): Promise<number> {
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM tasks WHERE date = ? AND completed = 0`,
    date
  );
  return row?.count ?? 0;
}

export async function ensureTasksForDate(date: string) {
  const db = await dbPromise;

  for (let i = 0; i < templates.length; i++) {
    const item = templates[i]!;
    await db.runAsync(
      `INSERT OR IGNORE INTO tasks
       (date, title, description, category, target_minutes, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      date,
      item.title,
      item.description,
      item.category,
      item.targetMinutes,
      i
    );
  }
}

export async function ensureTasksForRange(start: string, days: number) {
  for (let i = 0; i < days; i++) {
    await ensureTasksForDate(addDays(start, i));
  }
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    description: row.description,
    category: row.category,
    targetMinutes: row.target_minutes,
    sortOrder: row.sort_order,
    completed: row.completed === 1,
    completedAt: row.completed_at,
  };
}

export async function getTasksForDate(date: string): Promise<Task[]> {
  const db = await dbPromise;
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks WHERE date = ? ORDER BY sort_order, id`,
    date
  );
  return rows.map(mapTask);
}

export async function setTaskCompleted(id: number, completed: boolean) {
  const db = await dbPromise;
  await db.runAsync(
    `UPDATE tasks
     SET completed = ?, completed_at = ?
     WHERE id = ?`,
    completed ? 1 : 0,
    completed ? new Date().toISOString() : null,
    id
  );
}

export async function getStats(start: string, end: string): Promise<PeriodStats> {
  const db = await dbPromise;
  const row = await db.getFirstAsync<{
    total: number;
    completed: number;
    planned_minutes: number;
    completed_minutes: number;
  }>(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(completed), 0) AS completed,
       COALESCE(SUM(target_minutes), 0) AS planned_minutes,
       COALESCE(SUM(CASE WHEN completed = 1 THEN target_minutes ELSE 0 END), 0) AS completed_minutes
     FROM tasks
     WHERE date BETWEEN ? AND ?`,
    start,
    end
  );

  const total = row?.total ?? 0;
  const completed = row?.completed ?? 0;

  return {
    total,
    completed,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    plannedMinutes: row?.planned_minutes ?? 0,
    completedMinutes: row?.completed_minutes ?? 0,
  };
}
