import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getNotificationSettings, ReminderSettings, saveNotificationSettings } from '../db/database';
import { SmartNotificationScheduler } from './SmartNotificationScheduler';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) });
function isGranted(status: Notifications.NotificationPermissionsStatus) { return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL; }

export const NotificationService = {
  async getPermissionStatus() { const status = await Notifications.getPermissionsAsync(); return { granted: isGranted(status), canAskAgain: status.canAskAgain }; },
  async requestPermission() {
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('smart-local-reminders', { name: 'Akıllı Hatırlatıcılar', importance: Notifications.AndroidImportance.DEFAULT });
    const current = await Notifications.getPermissionsAsync();
    const result = isGranted(current) ? current : await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    return { granted: isGranted(result), canAskAgain: result.canAskAgain };
  },
  openSystemSettings() { return Linking.openSettings(); },
  async disable() { const current = await getNotificationSettings(); await saveNotificationSettings({ ...current, enabled: false }); await SmartNotificationScheduler.rescheduleNext(); },
  async updateSettings(settings: ReminderSettings) {
    const current = await getNotificationSettings();
    await saveNotificationSettings({ ...current, enabled: settings.enabled, hour: settings.hour, minute: settings.minute });
    await SmartNotificationScheduler.rescheduleNext();
  },
  refreshSchedule() { return SmartNotificationScheduler.rescheduleNext(); },
  addResponseListener(onOpenToday: () => void) {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.destination === 'today') { void SmartNotificationScheduler.recordAppOpened(true); onOpenToday(); }
    });
  },
  async handleInitialResponse(onOpenToday: () => void) {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response?.notification.request.content.data?.destination === 'today') { await SmartNotificationScheduler.recordAppOpened(true); onOpenToday(); await Notifications.clearLastNotificationResponseAsync(); }
  },
};
