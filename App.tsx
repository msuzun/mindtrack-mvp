import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabs } from './src/components/BottomTabs';
import { initDatabase } from './src/db/database';
import { AboutScreen } from './src/screens/AboutScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { PerformanceInsightsScreen } from './src/screens/PerformanceInsightsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NotificationService } from './src/services/NotificationService';
import { useAppStore } from './src/store/useAppStore';
import { ThemeColors } from './src/theme';
import { ThemeProvider, useTheme, useThemedStyles } from './src/theme/ThemeProvider';
import { toLocalDateKey } from './src/utils/date';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppContent() {
  const { colors, resolvedTheme, ready: themeReady } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { tab, setTab, loadDay } = useAppStore();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splashTransitionVisible, setSplashTransitionVisible] = useState(false);
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const splashScale = useRef(new Animated.Value(0.95)).current;

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

  useEffect(() => {
    if (!ready || !themeReady) return;
    let active = true;
    void SplashScreen.hideAsync().catch(() => undefined).then(() => {
      if (!active) return;
      setSplashTransitionVisible(true);
      requestAnimationFrame(() => {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(splashOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.timing(splashScale, { toValue: 1, duration: 220, useNativeDriver: true }),
          ]),
          Animated.timing(splashOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
        ]).start(() => { if (active) setSplashTransitionVisible(false); });
      });
    });
    return () => { active = false; };
  }, [ready, splashOpacity, splashScale, themeReady]);

  useEffect(() => {
    if (error) void SplashScreen.hideAsync().catch(() => undefined);
  }, [error]);

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

  if (!ready || !themeReady) return null;

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
          {tab === 'goals' && <GoalsScreen />}
          {tab === 'progress' && <PerformanceInsightsScreen />}
          {tab === 'settings' && <SettingsScreen />}
          {tab === 'about' && <AboutScreen />}
        </View>
        <BottomTabs active={tab} onChange={setTab} />
        {splashTransitionVisible && (
          <View style={styles.splashOverlay} pointerEvents="none">
            <View style={styles.splashGlow} />
            <Animated.Image
              source={require('./assets/app-icons/icon-zen-foreground.png')}
              resizeMode="contain"
              style={[styles.splashLogo, { opacity: splashOpacity, transform: [{ scale: splashScale }] }]}
            />
          </View>
        )}
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
  splashOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  splashGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: colors.illustrationGlowPrimary, transform: [{ scale: 1.25 }] },
  splashLogo: { width: 190, height: 190 },
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
