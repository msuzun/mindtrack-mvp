import * as SQLite from 'expo-sqlite';
import { initDatabase } from '../db/database';

export type AnalyticsTimeRange = 'weekly' | 'monthly' | 'yearly';
export type TrendPoint = { label: string; accuracy: number; sessions: number };
export type CognitiveAccuracyStats = {
  points: TrendPoint[];
  overallAccuracy: number;
  memoryAccuracy: number | null;
  cognitiveAccuracy: number | null;
  efficiencyIndex: number | null;
  sessionCount: number;
};
export type CapacityFocusStats = {
  averageCorrect: number;
  averageTotal: number;
  focusSeconds: number;
  weeklyFocusSeconds: number;
  capacityTrend: Array<{ label: string; value: number }>;
  focusTrend: Array<{ label: string; seconds: number }>;
};
export type AreaMetric = { type: string; label: string; accuracy: number; errors: number; averageSeconds: number };
export type StrengthWeaknessStats = { strength: AreaMetric | null; opportunity: AreaMetric | null };

const dbPromise = SQLite.openDatabaseAsync('mindtrack.db');
const TYPE_LABELS: Record<string, string> = {
  memory: 'Hafıza Egzersizleri', cognitive: 'Mantık Egzersizleri',
  mindfulness: 'Zihinsel Dinginlik', free_focus: 'Serbest Odak',
};

function rangeSpec(range: AnalyticsTimeRange) {
  const from = new Date();
  if (range === 'weekly') from.setDate(from.getDate() - 27);
  else if (range === 'monthly') from.setDate(from.getDate() - 364);
  else from.setFullYear(from.getFullYear() - 4);
  const bucket = range === 'weekly' ? "%Y-H%W" : range === 'monthly' ? '%Y-%m' : '%Y';
  return { from: from.toISOString(), bucket };
}

function round(value: unknown, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(Number(value ?? 0) * factor) / factor;
}

export const AnalyticsService = {
  async getCognitiveAccuracyTrend(range: AnalyticsTimeRange): Promise<CognitiveAccuracyStats> {
    await initDatabase();
    const db = await dbPromise;
    const { from, bucket } = rangeSpec(range);
    const [points, summary, efficiency] = await Promise.all([
      db.getAllAsync<any>(
        `SELECT strftime('${bucket}', ts.created_at, 'localtime') AS label,
          100.0 * SUM(ts.correct_count) / NULLIF(SUM(ts.total_items), 0) AS accuracy,
          COUNT(*) AS sessions
         FROM training_sessions ts
         LEFT JOIN task_instances ti ON ti.id = ts.task_instance_id
         WHERE ts.created_at >= ? AND ts.session_type IN ('memory','cognitive')
           AND ts.total_items > 0 AND ts.correct_count IS NOT NULL
         GROUP BY label ORDER BY MIN(ts.created_at)`, from
      ),
      db.getFirstAsync<any>(
        `SELECT COUNT(*) AS session_count,
          100.0 * SUM(correct_count) / NULLIF(SUM(total_items), 0) AS overall_accuracy,
          100.0 * SUM(CASE WHEN session_type='memory' THEN correct_count END) /
            NULLIF(SUM(CASE WHEN session_type='memory' THEN total_items END), 0) AS memory_accuracy,
          100.0 * SUM(CASE WHEN session_type='cognitive' THEN correct_count END) /
            NULLIF(SUM(CASE WHEN session_type='cognitive' THEN total_items END), 0) AS cognitive_accuracy
         FROM training_sessions WHERE created_at >= ?
           AND session_type IN ('memory','cognitive') AND total_items > 0`, from
      ),
      db.getFirstAsync<any>(
        `SELECT COUNT(*) n, SUM(speed) sum_x, SUM(accuracy_rate) sum_y,
           SUM(speed * accuracy_rate) sum_xy, SUM(speed * speed) sum_x2,
           SUM(accuracy_rate * accuracy_rate) sum_y2
           FROM (SELECT 1.0 * total_items / duration_seconds AS speed, accuracy_rate
             FROM training_sessions WHERE created_at >= ? AND total_items > 0
               AND duration_seconds > 0 AND accuracy_rate IS NOT NULL)`, from
      ),
    ]);
    const n = Number(efficiency?.n ?? 0);
    const numerator = n * Number(efficiency?.sum_xy ?? 0) - Number(efficiency?.sum_x ?? 0) * Number(efficiency?.sum_y ?? 0);
    const denominator = Math.sqrt(
      (n * Number(efficiency?.sum_x2 ?? 0) - Number(efficiency?.sum_x ?? 0) ** 2) *
      (n * Number(efficiency?.sum_y2 ?? 0) - Number(efficiency?.sum_y ?? 0) ** 2)
    );
    const correlation = n > 1 && denominator > 0 ? numerator / denominator : null;
    return {
      points: points.map((row) => ({ label: row.label, accuracy: round(row.accuracy, 1), sessions: Number(row.sessions) })),
      overallAccuracy: round(summary?.overall_accuracy, 1),
      memoryAccuracy: summary?.memory_accuracy == null ? null : round(summary.memory_accuracy, 1),
      cognitiveAccuracy: summary?.cognitive_accuracy == null ? null : round(summary.cognitive_accuracy, 1),
      efficiencyIndex: correlation == null ? null : round(correlation, 2),
      sessionCount: Number(summary?.session_count ?? 0),
    };
  },

  async getCapacityAndFocusStats(range: AnalyticsTimeRange): Promise<CapacityFocusStats> {
    await initDatabase();
    const db = await dbPromise;
    const { from, bucket } = rangeSpec(range);
    const [summary, trend] = await Promise.all([
      db.getFirstAsync<any>(
        `SELECT AVG(CASE WHEN session_type='memory' THEN correct_count END) AS avg_correct,
          AVG(CASE WHEN session_type='memory' THEN total_items END) AS avg_total,
          COALESCE(SUM(duration_seconds), 0) AS focus_seconds,
          COALESCE(SUM(CASE WHEN created_at >= datetime('now', '-6 days') THEN duration_seconds ELSE 0 END), 0) AS weekly_focus_seconds
         FROM training_sessions WHERE created_at >= ?`, from
      ),
      db.getAllAsync<any>(
        `SELECT strftime('${bucket}', ts.created_at, 'localtime') AS label,
          AVG(CASE WHEN ts.session_type='memory' THEN ts.correct_count END) AS capacity,
          COALESCE(SUM(ts.duration_seconds), 0) AS focus_seconds
         FROM training_sessions ts
         LEFT JOIN task_instances ti ON ti.id = ts.task_instance_id
         WHERE ts.created_at >= ?
         GROUP BY label ORDER BY MIN(ts.created_at)`, from
      ),
    ]);
    return {
      averageCorrect: round(summary?.avg_correct, 1), averageTotal: round(summary?.avg_total, 1),
      focusSeconds: Number(summary?.focus_seconds ?? 0),
      weeklyFocusSeconds: Number(summary?.weekly_focus_seconds ?? 0),
      capacityTrend: trend.filter((row) => row.capacity != null).map((row) => ({ label: row.label, value: round(row.capacity, 1) })),
      focusTrend: trend.map((row) => ({ label: row.label, seconds: Number(row.focus_seconds ?? 0) })),
    };
  },

  async getStrengthsAndWeaknesses(): Promise<StrengthWeaknessStats> {
    await initDatabase();
    const db = await dbPromise;
    const rows = await db.getAllAsync<any>(
      `SELECT ts.session_type,
        100.0 * SUM(ts.correct_count) / NULLIF(SUM(ts.total_items), 0) AS accuracy,
        COALESCE(SUM(ts.incorrect_count), 0) AS errors,
        AVG(ts.duration_seconds) AS average_seconds
       FROM training_sessions ts
       LEFT JOIN task_instances ti ON ti.id = ts.task_instance_id
       WHERE ts.session_type IN ('memory','cognitive') AND ts.total_items > 0
       GROUP BY ts.session_type HAVING COUNT(*) > 0`
    );
    const metrics = rows.map((row): AreaMetric => ({
      type: row.session_type, label: TYPE_LABELS[row.session_type] ?? row.session_type,
      accuracy: round(row.accuracy, 1), errors: Number(row.errors ?? 0), averageSeconds: round(row.average_seconds),
    }));
    const byAccuracy = [...metrics].sort((a, b) => b.accuracy - a.accuracy);
    const byNeed = [...metrics].sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors || b.averageSeconds - a.averageSeconds);
    return { strength: byAccuracy[0] ?? null, opportunity: byNeed[0] ?? null };
  },
};
