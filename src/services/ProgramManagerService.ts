import programSeed from '../data/programs.json';
import { getDatabase } from '../db/database';
import { ProgramDefinition, ProgramGraduationSummary, ProgramWeekTemplate, UserEnrolledProgram } from '../types';
import { addDays, toLocalDateKey } from '../utils/date';
import { SmartNotificationScheduler } from './SmartNotificationScheduler';

const programs = programSeed as ProgramDefinition[];
const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const isoWeekday = (dateKey: string) => { const day = new Date(`${dateKey}T12:00:00`).getDay(); return day === 0 ? 7 : day; };
const daysBetween = (from: string, to: string) => Math.max(0, Math.floor((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86_400_000));

async function seed() {
  const db = await getDatabase();
  for (const program of programs) await db.runAsync(
    `INSERT INTO programs (id,title,description,category,duration_weeks,level,curriculum_json) VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,category=excluded.category,
       duration_weeks=excluded.duration_weeks,level=excluded.level,curriculum_json=excluded.curriculum_json`,
    program.id, program.title, program.description, program.category, program.durationWeeks, program.level, JSON.stringify(program.curriculum)
  );
}

async function materializeWeek(db: Awaited<ReturnType<typeof getDatabase>>, enrollmentId: string, goalId: string, startDate: string, template: ProgramWeekTemplate) {
  const weekStart = addDays(startDate, (template.week - 1) * 7);
  for (let index = 0; index < template.routines.length; index++) {
    const routine = template.routines[index]!; const routineId = `${enrollmentId}-w${template.week}-${routine.id}`;
    await db.runAsync(
      `INSERT OR IGNORE INTO routines (id,goal_id,title,frequency_type,days_of_week,is_active,created_at,description,category,target_minutes,
       default_item_count,estimated_duration_minutes,sort_order,program_enrollment_id,program_week)
       VALUES (?,?,?,'specific_days',?,1,?,?,?,?,?,?,?,?,?)`,
      routineId, goalId, routine.title, JSON.stringify(routine.daysOfWeek), new Date().toISOString(), routine.description,
      routine.category, routine.targetMinutes, routine.itemCount ?? 0, routine.targetMinutes, index, enrollmentId, template.week
    );
    for (let day = 0; day < 7; day++) {
      const date = addDays(weekStart, day); if (!routine.daysOfWeek.includes(isoWeekday(date))) continue;
      await db.runAsync(
        `INSERT OR IGNORE INTO task_instances (id,routine_id,goal_id,title,scheduled_date,description,category,target_minutes,sort_order)
         VALUES (?,?,?,?,?,?,?,?,?)`, `${routineId}-${date}`, routineId, goalId, routine.title, date, routine.description, routine.category, routine.targetMinutes, index
      );
    }
  }
}

function mapEnrollment(row: any): UserEnrolledProgram {
  return { id: row.id, programId: row.program_id, goalId: row.goal_id, startDate: row.start_date, currentWeek: row.current_week,
    status: row.status, pausedAt: row.paused_at, completedAt: row.completed_at, title: row.title, description: row.description,
    category: row.category, durationWeeks: row.duration_weeks, level: row.level,
    weekCompleted: Number(row.week_completed ?? 0), weekTotal: Number(row.week_total ?? 0) };
}

export const ProgramManagerService = {
  async getCatalog() { await seed(); return programs; },

  async getEnrollments(): Promise<UserEnrolledProgram[]> {
    await seed(); const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT e.*,p.title,p.description,p.category,p.duration_weeks,p.level,
       COUNT(DISTINCT t.scheduled_date) AS week_total,
       COUNT(DISTINCT CASE WHEN t.is_completed=1 THEN t.scheduled_date END) AS week_completed
       FROM user_enrolled_programs e JOIN programs p ON p.id=e.program_id
       LEFT JOIN routines r ON r.program_enrollment_id=e.id AND r.program_week=e.current_week
       LEFT JOIN task_instances t ON t.routine_id=r.id
       GROUP BY e.id ORDER BY CASE e.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,e.start_date DESC`);
    return rows.map(mapEnrollment);
  },

  async enroll(programId: string, startDate: string) {
    await seed(); const db = await getDatabase(); const program = programs.find((item) => item.id === programId);
    if (!program) throw new Error('Program bulunamadı.');
    const active = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM user_enrolled_programs WHERE status='active'`);
    if ((active?.count ?? 0) >= 2) throw new Error('Aynı anda en fazla iki aktif program sürdürebilirsin. Önce bir programı duraklatabilirsin.');
    const enrollmentId = id('enrollment'); const goalId = id('goal'); const now = new Date().toISOString();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`INSERT INTO goals (id,title,description,target_date,status,created_at) VALUES (?,?,?,?, 'active',?)`,
        goalId, program.title, program.description, addDays(startDate, program.durationWeeks * 7 - 1), now);
      await db.runAsync(`INSERT INTO user_enrolled_programs (id,program_id,goal_id,start_date,current_week,status) VALUES (?,?,?,?,1,'active')`, enrollmentId, programId, goalId, startDate);
      await materializeWeek(db, enrollmentId, goalId, startDate, program.curriculum[0]!);
    });
    await SmartNotificationScheduler.rescheduleNext(); return enrollmentId;
  },

  async pause(enrollmentId: string) {
    const db = await getDatabase(); const now = new Date().toISOString();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`UPDATE user_enrolled_programs SET status='paused',paused_at=? WHERE id=? AND status='active'`, now, enrollmentId);
      await db.runAsync(`UPDATE routines SET is_active=0 WHERE program_enrollment_id=?`, enrollmentId);
    });
    await SmartNotificationScheduler.rescheduleNext();
  },

  async resume(enrollmentId: string) {
    const db = await getDatabase(); const row = await db.getFirstAsync<any>(`SELECT * FROM user_enrolled_programs WHERE id=? AND status='paused'`, enrollmentId);
    if (!row) return;
    const active = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM user_enrolled_programs WHERE status='active'`);
    if ((active?.count ?? 0) >= 2) throw new Error('Devam etmek için aktif programlarından birini duraklatmalısın.');
    const today = toLocalDateKey(); const pausedDate = String(row.paused_at).slice(0, 10); const shift = daysBetween(pausedDate, today);
    await db.withTransactionAsync(async () => {
      if (shift > 0) {
        const tasks = await db.getAllAsync<{ id: string; scheduled_date: string }>(
          `SELECT t.id,t.scheduled_date FROM task_instances t JOIN routines r ON r.id=t.routine_id
           WHERE r.program_enrollment_id=? AND t.is_completed=0 AND t.scheduled_date>=?`, enrollmentId, pausedDate);
        for (const task of tasks) await db.runAsync(`UPDATE task_instances SET scheduled_date=? WHERE id=?`, addDays(task.scheduled_date, shift), task.id);
        await db.runAsync(`UPDATE user_enrolled_programs SET start_date=? WHERE id=?`, addDays(row.start_date, shift), enrollmentId);
      }
      await db.runAsync(`UPDATE user_enrolled_programs SET status='active',paused_at=NULL WHERE id=?`, enrollmentId);
      await db.runAsync(`UPDATE routines SET is_active=1 WHERE program_enrollment_id=?`, enrollmentId);
    });
    await SmartNotificationScheduler.rescheduleNext();
  },

  async evaluateMilestones(): Promise<ProgramGraduationSummary | null> {
    await seed(); const db = await getDatabase(); const enrollments = await this.getEnrollments();
    for (const enrollment of enrollments.filter((item) => item.status === 'active')) {
      const weekEnd = addDays(enrollment.startDate, enrollment.currentWeek * 7 - 1);
      const rate = enrollment.weekTotal ? enrollment.weekCompleted / enrollment.weekTotal : 0;
      if (toLocalDateKey() < weekEnd || rate < 0.8) continue;
      const program = programs.find((item) => item.id === enrollment.programId)!;
      if (enrollment.currentWeek < program.durationWeeks) {
        const nextWeek = enrollment.currentWeek + 1;
        await db.withTransactionAsync(async () => {
          await materializeWeek(db, enrollment.id, enrollment.goalId, enrollment.startDate, program.curriculum[nextWeek - 1]!);
          await db.runAsync(`UPDATE user_enrolled_programs SET current_week=? WHERE id=?`, nextWeek, enrollment.id);
        });
      } else {
        await db.withTransactionAsync(async () => {
          await db.runAsync(`UPDATE user_enrolled_programs SET status='completed',completed_at=? WHERE id=?`, new Date().toISOString(), enrollment.id);
          await db.runAsync(`UPDATE goals SET status='completed' WHERE id=?`, enrollment.goalId);
        });
        return this.getGraduationSummary(enrollment.id);
      }
    }
    return null;
  },

  async getGraduationSummary(enrollmentId: string): Promise<ProgramGraduationSummary> {
    const db = await getDatabase(); const row = await db.getFirstAsync<any>(
      `SELECT e.id,p.title,
       (SELECT COALESCE(SUM(x.total_items),0) FROM training_sessions x JOIN task_instances tx ON tx.id=x.task_instance_id WHERE tx.goal_id=e.goal_id) AS total_items,
       (SELECT COALESCE(SUM(x.duration_minutes),0) FROM focus_sessions x JOIN task_instances tx ON tx.id=x.task_instance_id WHERE tx.goal_id=e.goal_id) AS focus_minutes,
       (SELECT accuracy_rate FROM training_sessions x JOIN task_instances tx ON tx.id=x.task_instance_id WHERE tx.goal_id=e.goal_id AND accuracy_rate IS NOT NULL ORDER BY x.created_at DESC LIMIT 1) -
       (SELECT accuracy_rate FROM training_sessions x JOIN task_instances tx ON tx.id=x.task_instance_id WHERE tx.goal_id=e.goal_id AND accuracy_rate IS NOT NULL ORDER BY x.created_at ASC LIMIT 1) AS accuracy_change
       FROM user_enrolled_programs e JOIN programs p ON p.id=e.program_id WHERE e.id=?`, enrollmentId);
    return { enrollmentId, title: row?.title ?? 'Program', totalItems: Number(row?.total_items ?? 0), focusMinutes: Number(row?.focus_minutes ?? 0),
      accuracyChange: row?.accuracy_change == null ? null : Math.round(Number(row.accuracy_change) * 10) / 10, badge: 'MindTrack Program Mezunu' };
  },
};
