import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  ensureTasksForDate,
  getIncompleteTaskCount,
  getReminderSettings,
  ReminderSettings,
  saveReminderSettings,
} from '../db/database';
import { addDays, toLocalDateKey } from '../utils/date';

const CHANNEL_ID = 'daily-reminders';
const SCHEDULE_HORIZON_DAYS = 7;
const REMINDER_MARKER = 'mindtrack-daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isGranted(status: Notifications.NotificationPermissionsStatus) {
  return status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Günlük Hatırlatıcılar',
    description: 'Günlük görev ve odaklanma hatırlatıcıları',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#38bdf8',
  });
}

async function cancelMindTrackReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.kind === REMINDER_MARKER)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );
}

function notificationDate(dayOffset: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export const NotificationService = {
  async getPermissionStatus() {
    await ensureAndroidChannel();
    const status = await Notifications.getPermissionsAsync();
    return { granted: isGranted(status), canAskAgain: status.canAskAgain };
  },

  async requestPermission() {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    const result = isGranted(current)
      ? current
      : await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowSound: true, allowBadge: false },
        });
    return { granted: isGranted(result), canAskAgain: result.canAskAgain };
  },

  openSystemSettings() {
    return Linking.openSettings();
  },

  async disable() {
    const current = await getReminderSettings();
    await saveReminderSettings({ ...current, enabled: false });
    await cancelMindTrackReminders();
  },

  async updateSettings(settings: ReminderSettings) {
    await saveReminderSettings(settings);
    if (settings.enabled) await this.refreshSchedule();
    else await cancelMindTrackReminders();
  },

  async refreshSchedule() {
    const settings = await getReminderSettings();
    await cancelMindTrackReminders();
    if (!settings.enabled) return;

    const permission = await this.getPermissionStatus();
    if (!permission.granted) return;

    for (let offset = 0; offset < SCHEDULE_HORIZON_DAYS; offset++) {
      const triggerDate = notificationDate(offset, settings.hour, settings.minute);
      if (triggerDate.getTime() <= Date.now()) continue;

      const dateKey = addDays(toLocalDateKey(), offset);
      await ensureTasksForDate(dateKey);
      const incomplete = await getIncompleteTaskCount(dateKey);
      const body = incomplete > 0
        ? `Bugün tamamlanmayı bekleyen ${incomplete} görevin var. Zihnini tazelemeye hazır mısın?`
        : 'Bugünün hedefleri tamam! Ritmini koruduğun için harikasın.';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: incomplete > 0 ? 'Günlük odağın seni bekliyor' : 'Harika ilerleme!',
          body,
          sound: 'default',
          data: { kind: REMINDER_MARKER, destination: 'today', date: dateKey },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: CHANNEL_ID,
        },
      });
    }
  },

  addResponseListener(onOpenToday: () => void) {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.destination === 'today') {
        onOpenToday();
      }
    });
  },

  async handleInitialResponse(onOpenToday: () => void) {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response?.notification.request.content.data?.destination === 'today') {
      onOpenToday();
      await Notifications.clearLastNotificationResponseAsync();
    }
  },
};
