import { NativeModules, Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import { getAppSetting, setAppSetting } from '../db/database';

export type AppIconId = 'zen-blue' | 'midnight' | 'pure-light' | 'solar-sunset';
const STORAGE_KEY = '@mindtrack/app-icon';

type NativeIconModule = { setIcon: (iconId: AppIconId) => Promise<void> };

function getNativeModule(): NativeIconModule | null {
  try {
    if (Platform.OS === 'ios') return requireNativeModule<NativeIconModule>('MindTrackAppIcon');
    if (Platform.OS === 'android') return NativeModules.MindTrackAppIcon as NativeIconModule | undefined ?? null;
    return null;
  } catch {
    return null;
  }
}

export const AppIconService = {
  async getSelected(): Promise<AppIconId> {
    const saved = await getAppSetting(STORAGE_KEY);
    return saved === 'midnight' || saved === 'pure-light' || saved === 'solar-sunset' ? saved : 'zen-blue';
  },

  isSupported() {
    return getNativeModule() !== null;
  },

  async setIcon(iconId: AppIconId) {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw new Error('Bu geliştirme yapısı alternatif ikon modülünü içermiyor. Uygulamayı yeniden derleyin.');
    const previous = await this.getSelected();
    await setAppSetting(STORAGE_KEY, iconId);
    try {
      await nativeModule.setIcon(iconId);
    } catch (error) {
      await setAppSetting(STORAGE_KEY, previous);
      throw error;
    }
  },
};
