import { getDatabase } from '../db/database';
import { Benchmark, BenchmarkType, ReviewMetrics, ReviewPeriodType } from '../types';
import { addDays, endOfWeek, startOfWeek, toLocalDateKey } from '../utils/date';

const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
async function aggregate(start: string, end: string) {
  const db = await getDatabase();
  return db.getFirstAsync<any>(
    `SELECT COUNT(DISTINCT ts.id) AS sessions,COALESCE(SUM(ts.duration_seconds),0)/60.0 AS focus_minutes,
      100.0*SUM(ts.correct_count)/NULLIF(SUM(ts.total_items),0) AS accuracy,
      (SELECT 100.0*SUM(is_completed)/NULLIF(COUNT(*),0) FROM task_instances WHERE scheduled_date BETWEEN ? AND ?) AS consistency
     FROM training_sessions ts WHERE date(ts.created_at,'localtime') BETWEEN ? AND ?`, start, end, start, end);
}

export const ReviewMetricsCalculator = {
  async calculate(days: 7 | 30 | 90 = 30): Promise<ReviewMetrics> {
    const periodEnd = toLocalDateKey(); const periodStart = days === 7 ? startOfWeek(periodEnd) : addDays(periodEnd, -(days - 1));
    const previousEnd = addDays(periodStart, -1); const previousStart = addDays(previousEnd, -(days - 1)); const ninetyStart = addDays(periodEnd, -89);
    const [current, previous, ninety] = await Promise.all([aggregate(periodStart, periodEnd), aggregate(previousStart, previousEnd), aggregate(ninetyStart, periodEnd)]);
    const db = await getDatabase(); const peak = await db.getFirstAsync<any>(
      `SELECT created_at,accuracy_rate,duration_seconds FROM training_sessions WHERE date(created_at,'localtime') BETWEEN ? AND ?
       ORDER BY COALESCE(accuracy_rate,0) DESC,duration_seconds DESC LIMIT 1`, periodStart, periodEnd);
    const currentAccuracy = current?.accuracy == null ? null : Math.round(Number(current.accuracy) * 10) / 10;
    const previousAccuracy = previous?.accuracy == null ? null : Math.round(Number(previous.accuracy) * 10) / 10;
    return { periodStart, periodEnd, consistencyRate: Math.round(Number(current?.consistency ?? 0)), focusMinutes: Math.round(Number(current?.focus_minutes ?? 0)),
      completedSessions: Number(current?.sessions ?? 0), peakMoment: peak?.created_at ?? null, currentAccuracy, previousAccuracy,
      ninetyDayAccuracy: ninety?.accuracy == null ? null : Math.round(Number(ninety.accuracy) * 10) / 10,
      accuracyDelta: currentAccuracy == null || previousAccuracy == null ? null : Math.round((currentAccuracy - previousAccuracy) * 10) / 10 };
  },

  async calculateWeekly() { const today = toLocalDateKey(); const start = startOfWeek(today); const end = endOfWeek(today); const result = await this.calculate(7); return { ...result, periodStart: start, periodEnd: end }; },

  async saveReview(periodType: ReviewPeriodType, metrics: ReviewMetrics, journal: { good?: string; struggle?: string; change?: string }) {
    const db = await getDatabase(); await db.runAsync(
      `INSERT INTO periodic_reviews (id,period_type,period_start,period_end,journal_good,journal_struggle,journal_change,summary_metrics_json,created_at)
       VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(period_type,period_start,period_end) DO UPDATE SET journal_good=excluded.journal_good,
       journal_struggle=excluded.journal_struggle,journal_change=excluded.journal_change,summary_metrics_json=excluded.summary_metrics_json`,
      id('review'), periodType, metrics.periodStart, metrics.periodEnd, journal.good?.trim() || null, journal.struggle?.trim() || null,
      journal.change?.trim() || null, JSON.stringify(metrics), new Date().toISOString());
  },

  async saveBenchmark(benchmarkType: BenchmarkType, score: number): Promise<Benchmark> {
    const db = await getDatabase(); const baseline = await db.getFirstAsync<{ score: number }>('SELECT score FROM benchmarks WHERE benchmark_type=? ORDER BY taken_at LIMIT 1', benchmarkType);
    const benchmark = { id: id('benchmark'), benchmarkType, score, baselineComparisonDelta: Math.round((score - Number(baseline?.score ?? score)) * 10) / 10, takenAt: new Date().toISOString() };
    await db.runAsync('INSERT INTO benchmarks (id,benchmark_type,score,baseline_comparison_delta,taken_at) VALUES (?,?,?,?,?)', benchmark.id, benchmarkType, benchmark.score, benchmark.baselineComparisonDelta, benchmark.takenAt); return benchmark;
  },

  async getBenchmarkComparison(benchmarkType: BenchmarkType) {
    const db = await getDatabase(); const rows = await db.getAllAsync<any>('SELECT * FROM benchmarks WHERE benchmark_type=? ORDER BY taken_at', benchmarkType);
    if (!rows.length) return null; return { baseline: Number(rows[0]!.score), current: Number(rows.at(-1)!.score), delta: Number(rows.at(-1)!.baseline_comparison_delta), lastTakenAt: rows.at(-1)!.taken_at as string };
  },
};
