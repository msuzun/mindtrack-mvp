import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabs } from './src/components/BottomTabs';
import { initDatabase } from './src/db/database';
import { AboutScreen } from './src/screens/AboutScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NotificationService } from './src/services/NotificationService';
import { useAppStore } from './src/store/useAppStore';
import { ThemeColors } from './src/theme';
import { ThemeProvider, useTheme, useThemedStyles } from './src/theme/ThemeProvider';
import { toLocalDateKey } from './src/utils/date';

function AppContent() {
  const { colors, resolvedTheme, ready: themeReady } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { tab, setTab, loadDay } = useAppStore();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        await initDatabase();
        await loadDay(toLocalDateKey());
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Bilinmeyen hata');
      }
    })();
  }, [loadDay]);

  useEffect(() => {
    if (!ready) return;
    void NotificationService.refreshSchedule();
    void NotificationService.handleInitialResponse(() => setTab('today'));
    const responseSubscription = NotificationService.addResponseListener(() => setTab('today'));
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void NotificationService.refreshSchedule();
    });
    return () => {
      responseSubscription.remove();
      appStateSubscription.remove();
    };
  }, [ready, setTab]);

  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.center}>
          <View style={styles.messageCard}>
            <Text style={styles.errorEyebrow}>BAĞLANTI HATASI</Text>
            <Text style={styles.errorTitle}>Veritabanı başlatılamadı</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!ready || !themeReady) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loading}>MindTrack hazırlanıyor…</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar
          barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
          translucent={false}
        />
        <View style={styles.body}>
          {tab === 'today' && <TodayScreen />}
          {tab === 'plan' && <PlanScreen />}
          {tab === 'progress' && <ProgressScreen />}
          {tab === 'settings' && <SettingsScreen />}
          {tab === 'about' && <AboutScreen />}
        </View>
        <BottomTabs active={tab} onChange={setTab} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return <ThemeProvider><AppContent /></ThemeProvider>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  center: {
    flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loading: { marginTop: 14, color: colors.textMuted, fontWeight: '600' },
  messageCard: {
    width: '100%', padding: 20, borderRadius: 16, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  errorEyebrow: { color: colors.danger, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  errorTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 20, marginTop: 8 },
  errorText: { color: colors.textMuted, lineHeight: 21, marginTop: 8 },
});
