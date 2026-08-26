import { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BottomTabs } from './src/components/BottomTabs';
import { initDatabase } from './src/db/database';
import { PlanScreen } from './src/screens/PlanScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { useAppStore } from './src/store/useAppStore';
import { toLocalDateKey } from './src/utils/date';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
          <Text style={styles.errorTitle}>Veritabanı başlatılamadı</Text>
          <Text>{error}</Text>
        </SafeAreaView>
      </SafeAreaProvider>

    );
  }

  if (!ready) {
    return (
      <SafeAreaProvider>

        <SafeAreaView style={styles.center}>
          <Text style={styles.loading}>MindTrack hazırlanıyor…</Text>
        </SafeAreaView>
      </SafeAreaProvider>

    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
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
  safe: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  body: {
    flex: 1,
  },
  center: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f8fa',
  },
  loading: {
    fontWeight: '800',
  },
  errorTitle: {
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 8,
  },
});
