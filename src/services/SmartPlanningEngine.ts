import * as SQLite from 'expo-sqlite';
import { initDatabase } from '../db/database';
import { Category, SmartSuggestion, SmartSuggestionType } from '../types';
import { addDays, toLocalDateKey } from '../utils/date';

const dbPromise = SQLite.openDatabaseAsync('mindtrack.db');
const newId = () => `suggestion-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

function mapSuggestion(row: any): SmartSuggestion {
  let payload: Record<string, unknown> = {};
  try { payload = JSON.parse(row.payload); } catch { payload = {}; }
  return { id: row.id, type: row.type, payload, status: row.status, createdAt: row.created_at, message: String(payload.message ?? '') };
}

async function createOnce(type: SmartSuggestionType, dedupeKey: string, payload: Record<string, unknown>) {
  const db = await dbPromise;
  const exists = await db.getFirstAsync(
    `SELECT 1 FROM smart_suggestions WHERE type = ? AND payload LIKE ? LIMIT 1`, type, `%"dedupeKey":"${dedupeKey}"%`
  );
  if (exists) return;
  await db.runAsync(
    `INSERT INTO smart_suggestions (id, type, payload, status, created_at) VALUES (?, ?, ?, 'pending', ?)`,
    newId(), type, JSON.stringify({ ...payload, dedupeKey }), new Date().toISOString()
  );
}

async function nextLightDate(from: string) {
  const db = await dbPromise;
  const dates = Array.from({ length: 7 }, (_, index) => addDays(from, index + 1));
  const rows = await db.getAllAsync<{ date: string; count: number }>(
    `SELECT scheduled_date AS date, COUNT(*) AS count FROM task_instances
     WHERE scheduled_date BETWEEN ? AND ? AND is_completed = 0 GROUP BY scheduled_date`, dates[0]!, dates[dates.length - 1]!
  );
  const counts = new Map(rows.map((row) => [row.date, Number(row.count)]));
  return dates.sort((a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0))[0]!;
}

export const SmartPlanningEngine = {
  async getPendingSuggestion() {
    await initDatabase();
    const db = await dbPromise;
    const row = await db.getFirstAsync<any>(`SELECT * FROM smart_suggestions WHERE status='pending' ORDER BY created_at DESC LIMIT 1`);
    return row ? mapSuggestion(row) : null;
  },

  async evaluate(dateKey = toLocalDateKey()) {
    await initDatabase();
    const db = await dbPromise;
    const routines = await db.getAllAsync<any>(`SELECT id, title, default_item_count, estimated_duration_minutes FROM routines WHERE is_active=1`);
    for (const routine of routines) {
      const sessions = await db.getAllAsync<any>(
        `SELECT ts.accuracy_rate, ts.duration_seconds FROM training_sessions ts
         JOIN task_instances ti ON ti.id=ts.task_instance_id
         WHERE ti.routine_id=? AND ts.accuracy_rate IS NOT NULL
         ORDER BY ts.created_at DESC LIMIT 3`, routine.id
      );
      const current = Number(routine.default_item_count ?? 30);
      if (sessions.length >= 3 && sessions.slice(0, 3).every((item) => Number(item.accuracy_rate) >= 90)) {
        const next = current + 5;
        await createOnce('difficulty_increase', `${routine.id}:${current}:${next}`, {
          routineId: routine.id, previousValue: current, nextValue: next,
          message: `Harika bir seri yakaladın! Bir sonraki ${routine.title} çalışmasını ${current} → ${next} öğe olarak yükseltelim mi?`,
        });
      } else if (sessions.length >= 2 && sessions.slice(0, 2).every((item) =>
        Number(item.accuracy_rate) <= 60 || Number(item.duration_seconds) > Number(routine.estimated_duration_minutes ?? 20) * 90
      )) {
        const next = Math.max(5, current - 5);
        await createOnce('difficulty_decrease', `${routine.id}:${current}:${next}`, {
          routineId: routine.id, previousValue: current, nextValue: next,
          message: `Bu seviye biraz zorlamış görünüyor. Zihnini toparlamak için ${current} → ${next} öğeye çekelim mi?`,
        });
      }
    }

    const overdue = await db.getAllAsync<{ id: string }>(
      `SELECT id FROM task_instances WHERE scheduled_date < ? AND is_completed=0
       AND routine_id IS NULL AND goal_id IS NOT NULL ORDER BY scheduled_date, priority_level DESC`, dateKey
    );
    if (overdue.length > 0) {
      await createOnce('reschedule', `overdue:${dateKey}`, {
        taskIds: overdue.map((item) => item.id), today: dateKey, nextLightDate: await nextLightDate(dateKey),
        message: `Geçmişten kalan ${overdue.length} görevin var. Bunları bugüne mi aktaralım, yoksa sonraki boş güne mi erteleyelim?`,
      });
    }

    const todayTasks = await db.getAllAsync<any>(
      `SELECT id, priority_level FROM task_instances WHERE scheduled_date=? AND is_completed=0 ORDER BY priority_level DESC, sort_order`, dateKey
    );
    if (todayTasks.length > 5) {
      const target = await nextLightDate(dateKey);
      await createOnce('load_balance', `load:${dateKey}`, {
        taskIds: todayTasks.slice(5).map((item) => item.id), targetDate: target,
        message: `Bugün ${todayTasks.length} görevle yoğun görünüyor. Düşük öncelikli görevleri haftanın daha hafif günlerine dağıtmak ister misin?`,
      });
    }
    return this.getPendingSuggestion();
  },

  async apply(suggestion: SmartSuggestion, strategy?: 'today' | 'next_light') {
    await initDatabase();
    const db = await dbPromise;
    await db.withTransactionAsync(async () => {
      if (suggestion.type === 'difficulty_increase' || suggestion.type === 'difficulty_decrease') {
        await db.runAsync(`UPDATE routines SET default_item_count=? WHERE id=?`, Number(suggestion.payload.nextValue), String(suggestion.payload.routineId));
      } else if (suggestion.type === 'reschedule') {
        const ids = suggestion.payload.taskIds as string[];
        const target = strategy === 'next_light' ? String(suggestion.payload.nextLightDate) : String(suggestion.payload.today);
        for (const id of ids) await db.runAsync(`UPDATE task_instances SET scheduled_date=? WHERE id=? AND is_completed=0`, target, id);
      } else if (suggestion.type === 'load_balance') {
        for (const id of suggestion.payload.taskIds as string[]) {
          await db.runAsync(`UPDATE task_instances SET scheduled_date=? WHERE id=? AND is_completed=0`, String(suggestion.payload.targetDate), id);
        }
      }
      await db.runAsync(`UPDATE smart_suggestions SET status='accepted' WHERE id=?`, suggestion.id);
    });
  },

  async dismiss(id: string) {
    await initDatabase();
    const db = await dbPromise;
    await db.runAsync(`UPDATE smart_suggestions SET status='dismissed' WHERE id=?`, id);
  },

  async getProductiveHours(): Promise<Partial<Record<Category, number>>> {
    await initDatabase();
    const db = await dbPromise;
    const rows = await db.getAllAsync<any>(
      `SELECT ti.category, AVG(CAST(strftime('%H', ts.created_at, 'localtime') AS INTEGER)) AS productive_hour
       FROM training_sessions ts JOIN task_instances ti ON ti.id=ts.task_instance_id
       WHERE ts.accuracy_rate >= 75 OR ts.rating >= 4 GROUP BY ti.category`
    );
    return Object.fromEntries(rows.map((row) => [row.category, Math.round(Number(row.productive_hour))]));
  },
};
