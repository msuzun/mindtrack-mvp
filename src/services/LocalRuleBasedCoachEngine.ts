import { getDatabase } from '../db/database';
import { CoachActionType, CoachInsight } from '../types';
import { addDays, toLocalDateKey } from '../utils/date';
import { SmartNotificationScheduler } from './SmartNotificationScheduler';

export interface ICoachProvider {
  generateInsights(): Promise<CoachInsight[]>;
  applyAction(actionType: CoachActionType, payload: Record<string, unknown>): Promise<boolean>;
}

const round = (value: unknown, digits = 0) => { const factor = 10 ** digits; return Math.round(Number(value ?? 0) * factor) / factor; };
const weekdayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const insight = (partial: Omit<CoachInsight, 'createdAt'>): CoachInsight => ({ ...partial, createdAt: new Date().toISOString() });

async function balanceInsight(): Promise<CoachInsight | null> {
  const db = await getDatabase();
  const [memory, focus] = await Promise.all([
    db.getFirstAsync<any>(`SELECT SUM(CASE WHEN date(created_at,'localtime')>=date('now','-13 days') THEN 1 ELSE 0 END) recent,
      SUM(CASE WHEN date(created_at,'localtime') BETWEEN date('now','-27 days') AND date('now','-14 days') THEN 1 ELSE 0 END) previous
      FROM training_sessions WHERE session_type='memory'`),
    db.getFirstAsync<any>(`SELECT COUNT(*) count FROM focus_sessions WHERE date(completed_at,'localtime')>=date('now','-13 days')`),
  ]);
  const recent = Number(memory?.recent ?? 0); const previous = Number(memory?.previous ?? 0); const decline = previous ? Math.round((previous - recent) / previous * 100) : 0;
  if (previous < 3 || decline < 25 || Number(focus?.count ?? 0) < 4) return null;
  return insight({ id: 'balance-memory', category: 'balance', priority: 3,
    insightText: `Son 14 günde odak ritmin düzenli; hafıza antrenmanların önceki döneme göre %${decline} azaldı.`,
    recommendedActionText: 'Haftalık planı hafıza lehine dengele', actionType: 'update_goal', actionPayload: { category: 'memory', mode: 'balance_week' } });
}

async function speedAccuracyInsight(): Promise<CoachInsight | null> {
  const db = await getDatabase(); const rows = await db.getAllAsync<any>(
    `SELECT CASE WHEN date(created_at,'localtime')>=date('now','-6 days') THEN 'recent' ELSE 'previous' END period,
      100.0*SUM(correct_count)/NULLIF(SUM(total_items),0) accuracy,1.0*SUM(duration_seconds)/NULLIF(SUM(total_items),0) seconds_per_item,COUNT(*) sessions
     FROM training_sessions WHERE session_type='cognitive' AND total_items>0 AND date(created_at,'localtime')>=date('now','-13 days') GROUP BY period`);
  const recent = rows.find((row) => row.period === 'recent'); const previous = rows.find((row) => row.period === 'previous');
  if (!recent || !previous || recent.sessions < 2 || previous.sessions < 2) return null;
  const accuracyGain = Number(recent.accuracy) - Number(previous.accuracy); const timeIncrease = (Number(recent.seconds_per_item) / Number(previous.seconds_per_item) - 1) * 100;
  if (accuracyGain < 4 || timeIncrease < 15) return null;
  return insight({ id: 'speed-accuracy-tradeoff', category: 'speed_accuracy', priority: 2,
    insightText: `Mantık doğruluğun %${round(previous.accuracy)} → %${round(recent.accuracy)} yükseldi; soru başına süren %${round(timeIncrease)} arttı.`,
    recommendedActionText: 'Doğruluğu koruyup hedef süreyi hafifçe azalt', actionType: 'reduce_load', actionPayload: { category: 'cognitive', adjustment: 'pace' } });
}

async function scheduleInsight(): Promise<CoachInsight | null> {
  const db = await getDatabase(); const rows = await db.getAllAsync<any>(
    `SELECT CAST(strftime('%w',scheduled_date) AS INTEGER) weekday,COUNT(*) total,SUM(is_completed) completed,
      100.0*SUM(is_completed)/NULLIF(COUNT(*),0) rate FROM task_instances
     WHERE scheduled_date BETWEEN date('now','-29 days') AND date('now') GROUP BY weekday HAVING COUNT(*)>=3 ORDER BY rate`);
  if (rows.length < 3) return null; const worst = rows[0]!; const best = rows.at(-1)!; const average = rows.reduce((sum, row) => sum + Number(row.rate), 0) / rows.length;
  if (Number(worst.rate) > average - 15) return null;
  const sourceIso = worst.weekday === 0 ? 7 : Number(worst.weekday); const targetIso = best.weekday === 0 ? 7 : Number(best.weekday);
  return insight({ id: `schedule-low-${sourceIso}`, category: 'schedule', priority: 4,
    insightText: `${weekdayNames[worst.weekday]} günleri tamamlama oranın diğer günlerden düşük (%${round(worst.rate)}).`,
    recommendedActionText: `${weekdayNames[worst.weekday]} rutinlerini ${weekdayNames[best.weekday]} gününe taşı`, actionType: 'reschedule_routine', actionPayload: { sourceWeekday: sourceIso, targetWeekday: targetIso } });
}

async function recoveryInsight(): Promise<CoachInsight | null> {
  const db = await getDatabase(); const activity = await db.getFirstAsync<{ days: number }>(
    `SELECT COUNT(DISTINCT date(completed_at,'localtime')) days FROM task_instances WHERE completed_at>=datetime('now','-10 days')`);
  if (Number(activity?.days ?? 0) < 9) return null;
  const rows = await db.getAllAsync<any>(`SELECT accuracy_rate FROM training_sessions WHERE accuracy_rate IS NOT NULL ORDER BY created_at DESC LIMIT 7`);
  if (rows.length < 5) return null; const recent = (Number(rows[0].accuracy_rate) + Number(rows[1].accuracy_rate)) / 2; const priorRows = rows.slice(2); const prior = priorRows.reduce((sum, row) => sum + Number(row.accuracy_rate), 0) / priorRows.length;
  if (recent > prior - 4) return null;
  const tomorrow = addDays(toLocalDateKey(), 1);
  return insight({ id: 'recovery-overload', category: 'recovery', priority: 5,
    insightText: `Uzun süredir kesintisiz çalışıyorsun; son iki ölçümünde doğruluk ortalaman hafifçe geriledi.`,
    recommendedActionText: 'Yarını dinlenme günü olarak planla', actionType: 'set_rest_day', actionPayload: { date: tomorrow } });
}

export class LocalRuleBasedCoachEngine implements ICoachProvider {
  async generateInsights() {
    const db = await getDatabase(); const candidates = (await Promise.all([recoveryInsight(), scheduleInsight(), balanceInsight(), speedAccuracyInsight()])).filter((item): item is CoachInsight => Boolean(item));
    if (!candidates.length) return [];
    const hidden = await db.getAllAsync<{ insight_id: string }>(`SELECT insight_id FROM coach_insight_state WHERE dismissed_at>=datetime('now','-7 days')`); const hiddenIds = new Set(hidden.map((item) => item.insight_id));
    return candidates.filter((item) => !hiddenIds.has(item.id)).sort((a, b) => b.priority - a.priority).slice(0, 2);
  }

  async dismiss(insightId: string) {
    const db = await getDatabase(); await db.runAsync(`INSERT INTO coach_insight_state (insight_id,dismissed_at) VALUES (?,?) ON CONFLICT(insight_id) DO UPDATE SET dismissed_at=excluded.dismissed_at`, insightId, new Date().toISOString());
  }

  async applyAction(actionType: CoachActionType, payload: Record<string, unknown>) {
    const db = await getDatabase(); const today = toLocalDateKey();
    if (actionType === 'reduce_load') {
      const category = String(payload.category ?? 'cognitive');
      await db.withTransactionAsync(async () => {
        await db.runAsync(`UPDATE task_instances SET target_minutes=MAX(5,ROUND(target_minutes*0.8)) WHERE scheduled_date BETWEEN ? AND ? AND is_completed=0 AND category=?`, today, addDays(today, 6), category);
        await db.runAsync(`UPDATE routines SET target_minutes=MAX(5,ROUND(target_minutes*0.8)),estimated_duration_minutes=MAX(5,ROUND(estimated_duration_minutes*0.8)) WHERE category=? AND is_active=1`, category);
      });
    } else if (actionType === 'increase_difficulty') {
      const category = String(payload.category ?? 'memory');
      await db.runAsync(`UPDATE routines SET default_item_count=MAX(default_item_count+5,ROUND(default_item_count*1.2)) WHERE category=? AND is_active=1`, category);
    } else if (actionType === 'reschedule_routine') {
      const source = Number(payload.sourceWeekday); const target = Number(payload.targetWeekday); const routines = await db.getAllAsync<any>(`SELECT id,days_of_week FROM routines WHERE is_active=1`);
      await db.withTransactionAsync(async () => {
        for (const routine of routines) { let days: number[] = []; try { days = JSON.parse(routine.days_of_week); } catch { continue; } if (!days.includes(source) || days.includes(target)) continue;
          await db.runAsync('UPDATE routines SET days_of_week=? WHERE id=?', JSON.stringify(days.map((day) => day === source ? target : day).sort()), routine.id);
          const tasks = await db.getAllAsync<any>(`SELECT id,scheduled_date FROM task_instances WHERE routine_id=? AND is_completed=0 AND scheduled_date>=?`, routine.id, today);
          const delta = target > source ? target - source : 7 - source + target; for (const task of tasks.filter((item) => { const day = new Date(`${item.scheduled_date}T12:00:00`).getDay(); return (day === 0 ? 7 : day) === source; })) { const result = await db.runAsync('UPDATE OR IGNORE task_instances SET scheduled_date=? WHERE id=?', addDays(task.scheduled_date, delta), task.id); if (result.changes === 0) await db.runAsync('DELETE FROM task_instances WHERE id=? AND is_completed=0', task.id); }
        }
      });
    } else if (actionType === 'set_rest_day') {
      const date = String(payload.date ?? addDays(today, 1)); await db.withTransactionAsync(async () => { await db.runAsync(`INSERT OR REPLACE INTO rest_days (date,reason,created_at) VALUES (?,'coach_recovery',?)`, date, new Date().toISOString()); await db.runAsync('DELETE FROM task_instances WHERE scheduled_date=? AND is_completed=0', date); });
    } else if (actionType === 'update_goal') {
      const goalId = String(payload.goalId ?? ''); const category = String(payload.category ?? '');
      if (payload.mode === 'balance_week' && category) {
        await db.runAsync(`UPDATE task_instances SET priority_level=MAX(priority_level,2)
          WHERE category=? AND is_completed=0 AND scheduled_date BETWEEN ? AND ?`, category, today, addDays(today, 6));
      } else {
        if (!goalId) return false;
        await db.runAsync(`UPDATE routines SET target_minutes=MAX(5,ROUND(target_minutes*0.8)),estimated_duration_minutes=MAX(5,ROUND(estimated_duration_minutes*0.8)) WHERE goal_id=?`, goalId);
      }
    } else return false;
    await SmartNotificationScheduler.rescheduleNext(); return true;
  }
}

export const LocalCoach = new LocalRuleBasedCoachEngine();
export const applyCoachAction = (actionType: CoachActionType, payload: Record<string, unknown>) => LocalCoach.applyAction(actionType, payload);
