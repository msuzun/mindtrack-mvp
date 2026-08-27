import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FocusTimerMode, useFocusTimer } from '../hooks/useFocusTimer';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { Task } from '../types';
import { ZenBreathingCanvas } from './ZenBreathingCanvas';

const MODES: Array<{ value: FocusTimerMode; label: string }> = [
  { value: 15, label: '15 dk' },
  { value: 25, label: '25 dk' },
  { value: 45, label: '45 dk' },
  { value: 'stopwatch', label: 'Kronometre' },
];

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function ZenFocusModal({ task, onClose, onComplete }: {
  task: Task;
  onClose: () => void;
  onComplete: (durationSeconds: number) => Promise<void> | void;
}) {
  useKeepAwake('mindtrack-focus-session');
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const timer = useFocusTimer(task.id, task.targetMinutes === 15 || task.targetMinutes === 45 ? task.targetMinutes : 25);
  const [finishing, setFinishing] = useState(false);
  const finishingRef = useRef(false);

  const requestClose = () => {
    if (!timer.running && timer.elapsedSeconds() === 0) {
      onClose();
      return;
    }
    Alert.alert('Odak seansından çıkılsın mı?', 'Kaydedilmemiş süre sona erecek.', [
      { text: 'Odakta Kal', style: 'cancel' },
      { text: 'Çık', style: 'destructive', onPress: onClose },
    ]);
  };

  const complete = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    try {
      const durationSeconds = timer.elapsedSeconds();
      await timer.recordSession(durationSeconds);
      await onComplete(durationSeconds);
      onClose();
    } finally {
      finishingRef.current = false;
      setFinishing(false);
    }
  };

  useEffect(() => {
    if (timer.finished) void complete();
  }, [timer.finished]);

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={requestClose} statusBarTranslucent>
      <StatusBar hidden />
      <View style={[styles.screen, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 18 }]}>
        <Pressable onPress={requestClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Odak modunu kapat">
          <Text style={styles.closeText}>×</Text>
        </Pressable>

        <View style={styles.modeRow}>
          {MODES.map((item) => (
            <Pressable
              key={String(item.value)}
              onPress={() => timer.setMode(item.value)}
              style={[styles.mode, timer.mode === item.value && styles.modeActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: timer.mode === item.value }}
            >
              <Text style={[styles.modeText, timer.mode === item.value && styles.modeTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.center}>
          <Text style={styles.eyebrow}>{timer.running ? 'ODAKLANIYORSUN' : 'ZEN ODAK'}</Text>
          <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
          <View style={styles.canvasWrap}>
            <ZenBreathingCanvas active={timer.running} />
            <Text style={styles.timer} accessibilityLabel={`${formatTime(timer.seconds)} kaldı`}>
              {formatTime(timer.seconds)}
            </Text>
          </View>
          <Text style={styles.breathHint}>{timer.running ? 'Nefes al · Odakta kal · Bırak' : 'Hazır olduğunda ritmini başlat'}</Text>
        </View>

        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <Pressable onPress={timer.reset} style={styles.secondaryButton} accessibilityRole="button">
              <Text style={styles.secondaryText}>Sıfırla</Text>
            </Pressable>
            <Pressable onPress={timer.toggle} style={styles.primaryButton} accessibilityRole="button">
              <Text style={styles.primaryText}>{timer.running ? 'Duraklat' : 'Başlat'}</Text>
            </Pressable>
          </View>
          <Pressable disabled={finishing} onPress={() => void complete()} style={styles.completeButton} accessibilityRole="button">
            <Text style={styles.completeText}>{finishing ? 'Kaydediliyor…' : 'Görevi Tamamla'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, backgroundColor: colors.background },
  close: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  closeText: { color: colors.textMuted, fontSize: 28, lineHeight: 30, fontWeight: '300' },
  modeRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  mode: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  modeActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  modeText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  modeTextActive: { color: colors.onAccent },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  taskTitle: { color: colors.textPrimary, fontSize: 18, lineHeight: 26, fontWeight: '600', textAlign: 'center', marginTop: 12, maxWidth: 300 },
  canvasWrap: { width: 290, height: 290, alignItems: 'center', justifyContent: 'center', marginVertical: 5 },
  timer: { position: 'absolute', color: colors.textPrimary, fontSize: 52, fontWeight: '300', fontVariant: ['tabular-nums'], letterSpacing: 1 },
  breathHint: { color: colors.textMuted, fontSize: 12, letterSpacing: 0.4 },
  controls: { gap: 12 },
  controlRow: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1.35, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.accent },
  primaryText: { color: colors.onAccent, fontSize: 15, fontWeight: '800' },
  secondaryButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  completeButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  completeText: { color: colors.success, fontSize: 14, fontWeight: '700' },
});
