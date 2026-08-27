import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { Task, TrainingSessionType } from '../types';

export type PerformanceInput = {
  sessionType: TrainingSessionType;
  totalItems: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
  durationSeconds: number;
  rating: number | null;
  notes: string | null;
};

function typeForTask(task: Task): TrainingSessionType {
  if (task.category === 'memory') return 'memory';
  if (task.category === 'cognitive') return 'cognitive';
  if (task.category === 'spiritual') return 'mindfulness';
  return 'free_focus';
}

function Stepper({ label, value, onChange, step = 1, suffix = '' }: {
  label: string; value: number; onChange: (value: number) => void; step?: number; suffix?: string;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.stepperBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable onPress={() => onChange(Math.max(0, value - step))} style={styles.stepButton} accessibilityLabel={`${label} azalt`}>
          <Text style={styles.stepSymbol}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}{suffix}</Text>
        <Pressable onPress={() => onChange(value + step)} style={styles.stepButton} accessibilityLabel={`${label} artır`}>
          <Text style={styles.stepSymbol}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function PerformanceInputSheet({ visible, task, initialDurationSeconds = 0, onSave, onSkip, onDismiss }: {
  visible: boolean;
  task: Task | null;
  initialDurationSeconds?: number;
  onSave: (input: PerformanceInput) => Promise<void> | void;
  onSkip: () => Promise<void> | void;
  onDismiss: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const translateY = useRef(new Animated.Value(520)).current;
  const [minutes, setMinutes] = useState(15);
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionType = task ? typeForTask(task) : 'free_focus';
  const itemBased = sessionType === 'memory' || sessionType === 'cognitive';

  useEffect(() => {
    if (!visible) return;
    setMinutes(initialDurationSeconds > 0 ? Math.max(1, Math.round(initialDurationSeconds / 60)) : 15);
    setTotal(0); setCorrect(0); setIncorrect(0); setRating(null); setNotes(''); setSaving(false); setError(null);
    translateY.setValue(520);
    Animated.spring(translateY, { toValue: 0, speed: 22, bounciness: 0, useNativeDriver: true }).start();
  }, [initialDurationSeconds, translateY, visible]);

  const accuracy = useMemo(() => total > 0 ? Math.round(Math.min(correct, total) / total * 100) : null, [correct, total]);
  const finish = async (saveMetrics: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      if (saveMetrics) {
        await onSave({
          sessionType,
          totalItems: itemBased && total > 0 ? total : null,
          correctCount: itemBased && total > 0 ? Math.min(correct, total) : null,
          incorrectCount: itemBased && total > 0 ? Math.min(incorrect, total) : null,
          durationSeconds: initialDurationSeconds > 0 ? initialDurationSeconds : minutes * 60,
          rating: itemBased ? null : rating,
          notes: notes.trim() || null,
        });
      } else {
        await onSkip();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Oturum kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onDismiss} accessibilityLabel="Performans girişini kapat" />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.eyebrow}>OTURUM TAMAMLANDI</Text>
            <Text style={styles.title}>{task?.title ?? 'Odak çalışması'}</Text>
            <Text style={styles.subtitle}>İstersen birkaç dokunuşla performansını kaydet.</Text>

            <View style={styles.durationCard}>
              {initialDurationSeconds > 0 ? (
                <><Text style={styles.inputLabel}>ÖLÇÜLEN SÜRE</Text><Text style={styles.durationValue}>{Math.floor(initialDurationSeconds / 60)} dk {initialDurationSeconds % 60} sn</Text></>
              ) : <Stepper label="SÜRE" value={minutes} onChange={setMinutes} step={5} suffix=" dk" />}
            </View>

            {itemBased ? (
              <View style={styles.metricGrid}>
                <Stepper label={sessionType === 'memory' ? 'ÖĞE' : 'SORU'} value={total} onChange={setTotal} />
                <Stepper label="DOĞRU" value={correct} onChange={(value) => setCorrect(total > 0 ? Math.min(value, total) : value)} />
                <Stepper label="YANLIŞ" value={incorrect} onChange={(value) => setIncorrect(total > 0 ? Math.min(value, total) : value)} />
              </View>
            ) : (
              <View style={styles.ratingBlock}>
                <Text style={styles.inputLabel}>ODAKLANMA KALİTESİ · OPSİYONEL</Text>
                <View style={styles.ratingRow}>{[1, 2, 3, 4, 5].map((value) => (
                  <Pressable key={value} onPress={() => setRating(value)} style={[styles.rating, rating === value && styles.ratingActive]}>
                    <Text style={[styles.ratingText, rating === value && styles.ratingTextActive]}>{value}</Text>
                  </Pressable>
                ))}</View>
              </View>
            )}

            {accuracy != null && <View style={styles.accuracyBadge}><Text style={styles.accuracyText}>%{accuracy} Başarı</Text></View>}
            {error && <Text style={styles.error}>{error}</Text>}
            <TextInput
              value={notes} onChangeText={setNotes} maxLength={160}
              placeholder="Kısa not (opsiyonel)" placeholderTextColor={styles.placeholder.color}
              style={styles.notes} returnKeyType="done"
            />
            <Pressable disabled={saving} onPress={() => void finish(true)} style={styles.saveButton}>
              <Text style={styles.saveText}>{saving ? 'Kaydediliyor…' : 'Performansı Kaydet'}</Text>
            </Pressable>
            <Pressable disabled={saving} onPress={() => void finish(false)} style={styles.skipButton}>
              <Text style={styles.skipText}>Sadece Tamamla</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  modal: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.modalOverlay },
  sheet: { maxHeight: '88%', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 18 },
  eyebrow: { color: colors.success, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.textPrimary, fontSize: 21, lineHeight: 29, fontWeight: '700', marginTop: 5 },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 3, marginBottom: 16 },
  durationCard: { borderRadius: radii.card, backgroundColor: colors.surfaceRaised, padding: 13, marginBottom: 12 },
  durationValue: { color: colors.accent, fontSize: 23, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 5 },
  metricGrid: { gap: 9 }, stepperBlock: { flex: 1 }, inputLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  stepper: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, marginTop: 5 },
  stepButton: { width: 54, height: 50, alignItems: 'center', justifyContent: 'center' },
  stepSymbol: { color: colors.accent, fontSize: 25, fontWeight: '500' },
  stepValue: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  ratingBlock: { marginVertical: 5 }, ratingRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
  rating: { flex: 1, aspectRatio: 1, maxHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  ratingActive: { borderColor: colors.success, backgroundColor: colors.illustrationGlowSecondary },
  ratingText: { color: colors.textMuted, fontSize: 16, fontWeight: '700' }, ratingTextActive: { color: colors.success },
  accuracyBadge: { alignSelf: 'center', marginTop: 12, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.illustrationGlowSecondary },
  accuracyText: { color: colors.success, fontSize: 13, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 10 },
  notes: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background, paddingHorizontal: 14, marginTop: 12 },
  placeholder: { color: colors.textMuted },
  saveButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.accent, marginTop: 14 },
  saveText: { color: colors.onAccent, fontSize: 15, fontWeight: '800' },
  skipButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  skipText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
});
