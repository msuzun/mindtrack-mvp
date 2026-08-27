import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getNotificationDayContext, getNotificationSettings, getStats, getWeeklyStats, saveNotificationSettings } from '../db/database';
import { NotificationCategory, NotificationSettings } from '../types';
import { addDays, startOfWeek, toLocalDateKey } from '../utils/date';
import { RoutineSchedulerEngine } from './RoutineSchedulerEngine';
import { NotificationCopywriter } from './NotificationCopywriter';

const CHANNEL_ID = 'smart-local-reminders';
const SMART_KIND = 'mindtrack-smart-local';
const INTERRUPTED_KIND = 'mindtrack-interrupted-focus';
const HORIZON_DAYS = 7;

function categoryOf(value: string): NotificationCategory { return value === 'memory' ? 'memory' : value === 'cognitive' ? 'cognitive' : 'general'; }
function parseClock(clock: string) { const [h, m] = clock.split(':').map(Number); return (h ?? 0) * 60 + (m ?? 0); }
function inQuietHours(date: Date, settings: NotificationSettings) {
  const now = date.getHours() * 60 + date.getMinutes(); const start = parseClock(settings.quietHoursStart); const end = parseClock(settings.quietHoursEnd);
  return start === end ? false : start < end ? now >= start && now < end : now >= start || now < end;
}
function scheduleDate(offset: number, settings: NotificationSettings) { const date = new Date(); date.setDate(date.getDate() + offset); date.setHours(settings.hour, settings.minute, 0, 0); return date; }

async function ensureChannel() {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: 'Akıllı Hatırlatıcılar', importance: Notifications.AndroidImportance.DEFAULT, vibrationPattern: [0, 180], lightColor: '#38bdf8' });
}
async function cancelKinds(kinds: string[]) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((item) => kinds.includes(String(item.content.data?.kind))).map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}
async function cancelSmartForDate(dateKey: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((item) => item.content.data?.kind === SMART_KIND && item.content.data?.date === dateKey)
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}
async function streakBefore(dateKey: string) {
  const rows = await getWeeklyStats(addDays(dateKey, -6), dateKey); let streak = 0;
  for (let i = rows.length - 1; i >= 0; i--) { const row = rows[i]!; if (row.total > 0 && row.completed === row.total) streak++; else break; }
  return streak;
}

export const SmartNotificationScheduler = {
  async rescheduleNext() {
    const settings = await getNotificationSettings();
    await cancelKinds([SMART_KIND]);
    if (!settings.enabled) return;
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) return;
    await ensureChannel();
    const inactiveDays = settings.lastAppOpenedAt ? Math.floor((Date.now() - new Date(settings.lastAppOpenedAt).getTime()) / 86_400_000) : 0;
    const reduced = settings.autoReduceFrequency && Math.max(settings.ignoredCount, inactiveDays) >= 3;
    for (let offset = 0; offset < HORIZON_DAYS; offset++) {
      const projectedReduced = reduced || (settings.autoReduceFrequency && inactiveDays + offset >= 3);
      if (projectedReduced && offset % 2 === 1) continue;
      const trigger = scheduleDate(offset, settings); if (trigger.getTime() <= Date.now() || inQuietHours(trigger, settings)) continue;
      const dateKey = addDays(toLocalDateKey(), offset); await RoutineSchedulerEngine.materializeDate(dateKey);
      const tasks = await getNotificationDayContext(dateKey);
      const eligible = tasks.filter((task) => settings.enabledCategories.includes(categoryOf(task.category)));
      const remaining = eligible.filter((task) => !task.completed); if (!remaining.length) continue;
      const weekly = await getStats(startOfWeek(dateKey), dateKey);
      const copy = NotificationCopywriter.compose({ remainingCount: remaining.length, totalCount: eligible.length,
        remainingMinutes: remaining.reduce((sum, task) => sum + task.targetMinutes, 0), weeklyPercent: weekly.completionRate,
        streakDays: await streakBefore(addDays(dateKey, -1)) }, settings.tone);
      if (!copy) continue;
      await Notifications.scheduleNotificationAsync({ content: { ...copy, sound: 'default', data: { kind: SMART_KIND, destination: 'today', date: dateKey } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger, channelId: CHANNEL_ID } });
    }
  },

  async cancelTodayIfComplete() {
    const today = toLocalDateKey(); const tasks = await getNotificationDayContext(today);
    if (tasks.length && tasks.every((task) => task.completed)) await cancelSmartForDate(today); else await this.rescheduleNext();
  },

  async scheduleInterruptedFocus(taskId: string, taskTitle: string, taskCategory: string) {
    const settings = await getNotificationSettings(); if (!settings.enabled || !settings.enabledCategories.includes(categoryOf(taskCategory))) return;
    await ensureChannel(); const date = new Date(Date.now() + 2.5 * 60 * 60 * 1000);
    if (inQuietHours(date, settings)) return;
    const copy = NotificationCopywriter.interrupted(taskTitle, settings.tone);
    await Notifications.scheduleNotificationAsync({ content: { ...copy, sound: 'default', data: { kind: INTERRUPTED_KIND, destination: 'today', taskId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID } });
  },

  async recordAppOpened(fromNotification = false) {
    const settings = await getNotificationSettings();
    await saveNotificationSettings({ ...settings, ignoredCount: fromNotification ? 0 : settings.ignoredCount, lastAppOpenedAt: new Date().toISOString() });
  },
};
