import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabs } from './src/components/BottomTabs';
import { initDatabase } from './src/db/database';
import { AboutScreen } from './src/screens/AboutScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { useAppStore } from './src/store/useAppStore';
import { colors } from './src/theme';
import { toLocalDateKey } from './src/utils/date';

export default function App() {
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

  if (!ready) {
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
        <StatusBar style="light" />
        <View style={styles.body}>
          {tab === 'today' && <TodayScreen />}
          {tab === 'plan' && <PlanScreen />}
          {tab === 'progress' && <ProgressScreen />}
          {tab === 'about' && <AboutScreen />}
        </View>
        <BottomTabs active={tab} onChange={setTab} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  center: {
    flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loading: { marginTop: 14, color: colors.muted, fontWeight: '600' },
  messageCard: {
    width: '100%', padding: 20, borderRadius: 16, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  errorEyebrow: { color: colors.danger, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  errorTitle: { color: colors.text, fontWeight: '700', fontSize: 20, marginTop: 8 },
  errorText: { color: colors.muted, lineHeight: 21, marginTop: 8 },
});
