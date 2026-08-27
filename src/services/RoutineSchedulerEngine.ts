import { getActiveRoutines, insertRoutineTask, isRestDay } from '../db/database';
import { Routine } from '../types';
import { addDays } from '../utils/date';

function isoWeekday(dateKey: string) {
  const day = new Date(`${dateKey}T12:00:00`).getDay();
  return day === 0 ? 7 : day;
}

function daysBetween(startIso: string, dateKey: string) {
  const start = new Date(startIso);
  const target = new Date(`${dateKey}T12:00:00`);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  return Math.max(0, Math.floor((target.getTime() - startDay) / 86_400_000));
}

function shouldRun(routine: Routine, dateKey: string) {
  if (!routine.isActive) return false;
  if (routine.programEnrollmentId) {
    if (routine.programStatus !== 'active' || !routine.programStartDate || !routine.programWeek) return false;
    const weekStart = addDays(routine.programStartDate, (routine.programWeek - 1) * 7);
    if (dateKey < weekStart || dateKey > addDays(weekStart, 6)) return false;
  }
  if (routine.frequencyType === 'daily') return true;
  if (routine.frequencyType === 'specific_days') return routine.daysOfWeek.includes(isoWeekday(dateKey));
  return daysBetween(routine.createdAt, dateKey) % Math.max(1, routine.intervalDays) === 0;
}

export const RoutineSchedulerEngine = {
  async materializeDate(dateKey: string) {
    if (await isRestDay(dateKey)) return;
    const routines = await getActiveRoutines();
    const scheduled = routines.filter((routine) => shouldRun(routine, dateKey));
    await Promise.all(scheduled.map((routine) => insertRoutineTask(routine, dateKey)));
  },

  async materializeRange(startDate: string, dayCount: number) {
    for (let offset = 0; offset < dayCount; offset++) {
      await this.materializeDate(addDays(startDate, offset));
    }
  },
};
