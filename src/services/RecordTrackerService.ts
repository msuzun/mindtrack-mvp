import { getDatabase } from '../db/database';
import { PersonalRecord, PersonalRecordType, TrainingSession } from '../types';
import { HapticService } from './HapticService';

type Listener = (record: PersonalRecord) => void;
const listeners = new Set<Listener>();
const recordId = (type: PersonalRecordType) => `record-${type}`;
const map = (row: any): PersonalRecord => ({ id: row.id, recordType: row.record_type, value: Number(row.value), achievedAt: row.achieved_at, sessionId: row.session_id ?? null });

async function promote(type: PersonalRecordType, value: number | null, sessionId: string | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const db = await getDatabase(); const existing = await db.getFirstAsync<any>('SELECT * FROM personal_records WHERE record_type=?', type);
  if (existing && Number(existing.value) >= value) return null;
  const achievedAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO personal_records (id,record_type,value,achieved_at,session_id) VALUES (?,?,?,?,?)
     ON CONFLICT(record_type) DO UPDATE SET value=excluded.value,achieved_at=excluded.achieved_at,session_id=excluded.session_id`,
    recordId(type), type, value, achievedAt, sessionId
  );
  const record = { id: recordId(type), recordType: type, value, achievedAt, sessionId };
  listeners.forEach((listener) => listener(record)); await HapticService.taskCompleted(); return record;
}

export const RecordTrackerService = {
  subscribe(listener: Listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },

  async getRecords(): Promise<PersonalRecord[]> {
    const db = await getDatabase(); const rows = await db.getAllAsync<any>('SELECT * FROM personal_records ORDER BY achieved_at DESC'); return rows.map(map);
  },

  async checkTrainingSession(session: TrainingSession) {
    const newRecords: PersonalRecord[] = [];
    const items = await promote('max_items', session.sessionType === 'memory' ? session.correctCount : null, session.id); if (items) newRecords.push(items);
    const accuracy = await promote('peak_accuracy', session.accuracyRate, session.id); if (accuracy) newRecords.push(accuracy);
    const focus = await promote('longest_focus', session.durationSeconds > 0 ? Math.round(session.durationSeconds / 6) / 10 : null, session.id); if (focus) newRecords.push(focus);
    const streak = await this.checkDiscipline(session.id); if (streak) newRecords.push(streak);
    return newRecords;
  },

  async checkFocusSession(durationSeconds: number) {
    return promote('longest_focus', durationSeconds > 0 ? Math.round(durationSeconds / 6) / 10 : null, null);
  },

  async checkDiscipline(sessionId: string | null = null) {
    const db = await getDatabase();
    const bestWeek = await db.getFirstAsync<{ rate: number }>(
      `SELECT 100.0*SUM(is_completed)/NULLIF(COUNT(*),0) AS rate FROM task_instances
       GROUP BY strftime('%Y-%W',scheduled_date) HAVING COUNT(*)>0 ORDER BY rate DESC LIMIT 1`);
    return promote('best_streak_week', bestWeek?.rate == null ? null : Math.round(bestWeek.rate * 10) / 10, sessionId);
  },
};
