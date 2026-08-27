import * as Haptics from 'expo-haptics';
import { getAppSetting, setAppSetting } from '../db/database';

const STORAGE_KEY = '@mindtrack/haptics-enabled';
let enabledCache: boolean | null = null;

async function isEnabled() {
  if (enabledCache !== null) return enabledCache;
  try {
    enabledCache = (await getAppSetting(STORAGE_KEY)) !== 'false';
  } catch {
    enabledCache = true;
  }
  return enabledCache;
}

async function safelyPerform(action: () => Promise<void>) {
  if (!(await isEnabled())) return;
  try {
    await action();
  } catch {
    // Unsupported hardware, disabled system haptics and native errors are non-fatal.
  }
}

export const HapticService = {
  getEnabled: isEnabled,

  async setEnabled(enabled: boolean) {
    enabledCache = enabled;
    try {
      await setAppSetting(STORAGE_KEY, String(enabled));
    } catch {
      // The visual interaction must remain usable if persistence is unavailable.
    }
  },

  taskCompleted() {
    return safelyPerform(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },

  taskDeleted() {
    return safelyPerform(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },

  reorderStarted() {
    return safelyPerform(() => Haptics.selectionAsync());
  },
};
