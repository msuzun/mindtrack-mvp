import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GoalCard } from '../components/GoalCard';
import { createGoal, getGoalsOverview } from '../db/database';
import { SmartNotificationScheduler } from '../services/SmartNotificationScheduler';
import { useAppStore } from '../store/useAppStore';
import { radii, spacing, ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { GoalOverview, RoutineFrequency } from '../types';
import { toLocalDateKey } from '../utils/date';

const weekdays = [[1, 'Pzt'], [2, 'Sal'], [3, 'Çar'], [4, 'Per'], [5, 'Cum'], [6, 'Cmt'], [7, 'Paz']] as const;

export function GoalsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const loadDay = useAppStore((state) => state.loadDay);
  const [goals, setGoals] = useState<GoalOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const load = async () => {
    setGoals(await getGoalsOverview());
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  return <>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>GELİŞİM PLANI</Text>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}><Text style={styles.title}>Hedefler</Text><Text style={styles.subtitle}>Yönünü belirle; bugün yalnızca sıradaki küçük adıma odaklan.</Text></View>
        <Pressable onPress={() => setModalVisible(true)} style={styles.addButton} accessibilityRole="button"><Text style={styles.addText}>＋</Text></Pressable>
      </View>
      {loading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : goals.length === 0 ? <View style={styles.empty}>
        <Text style={styles.emptyTitle}>İlk yönünü belirle</Text>
        <Text style={styles.emptyText}>Bir hedef ve ona hizmet eden küçük bir rutin ekleyerek başla.</Text>
        <Pressable onPress={() => setModalVisible(true)} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Hedef Ekle</Text></Pressable>
      </View> : goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
    </ScrollView>
    <CreateGoalModal visible={modalVisible} onClose={() => setModalVisible(false)} onSaved={async () => {
      await load(); await loadDay(toLocalDateKey());
    }} />
  </>;
}

function CreateGoalModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const styles = useThemedStyles(createStyles);
  const [title, setTitle] = useState(''); const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState(''); const [routineTitle, setRoutineTitle] = useState('');
  const [frequency, setFrequency] = useState<RoutineFrequency>('daily'); const [days, setDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!title.trim() || saving) return; setSaving(true);
    try {
      await createGoal({ title, description, targetDate: /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : null, routineTitle, frequencyType: frequency, daysOfWeek: days });
      await SmartNotificationScheduler.rescheduleNext();
      setTitle(''); setDescription(''); setTargetDate(''); setRoutineTitle(''); setFrequency('daily'); setDays([]);
      await onSaved(); onClose();
    } finally { setSaving(false); }
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.modal}>
      <Text style={styles.modalTitle}>Yeni Hedef</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Hedef adı" placeholderTextColor={styles.placeholder.color} style={styles.input} />
      <TextInput value={description} onChangeText={setDescription} placeholder="Kısa açıklama (opsiyonel)" placeholderTextColor={styles.placeholder.color} style={styles.input} />
      <TextInput value={targetDate} onChangeText={setTargetDate} placeholder="Bitiş: YYYY-AA-GG" placeholderTextColor={styles.placeholder.color} style={styles.input} />
      <Text style={styles.fieldLabel}>HEDEFE RUTİN BAĞLA</Text>
      <TextInput value={routineTitle} onChangeText={setRoutineTitle} placeholder="Rutin adı (opsiyonel)" placeholderTextColor={styles.placeholder.color} style={styles.input} />
      <View style={styles.frequencyRow}>{([['daily', 'Her gün'], ['specific_days', 'Belirli günler']] as Array<[RoutineFrequency, string]>).map(([value, label]) => <Pressable key={value} onPress={() => setFrequency(value)} style={[styles.frequency, frequency === value && styles.frequencyActive]}><Text style={[styles.frequencyText, frequency === value && styles.frequencyTextActive]}>{label}</Text></Pressable>)}</View>
      {frequency === 'specific_days' && <View style={styles.weekdays}>{weekdays.map(([value, label]) => <Pressable key={value} onPress={() => setDays((current) => current.includes(value) ? current.filter((day) => day !== value) : [...current, value])} style={[styles.weekday, days.includes(value) && styles.weekdayActive]}><Text style={[styles.weekdayText, days.includes(value) && styles.weekdayTextActive]}>{label}</Text></Pressable>)}</View>}
      <View style={styles.actions}><Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Vazgeç</Text></Pressable><Pressable disabled={!title.trim() || saving} onPress={() => void save()} style={[styles.save, (!title.trim() || saving) && styles.disabled]}><Text style={styles.saveText}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Text></Pressable></View>
    </View></View>
  </Modal>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 22, paddingBottom: 38 }, eyebrow: { color: colors.accent, fontSize: 10, lineHeight: 15, fontWeight: '700', letterSpacing: 1.3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7, marginBottom: 24 }, titleCopy: { flex: 1 }, title: { color: colors.textPrimary, fontSize: 30, lineHeight: 39, fontWeight: '600' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19.5, marginTop: 3, paddingRight: 12 }, addButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }, addText: { color: colors.onAccent, fontSize: 24, lineHeight: 28, fontWeight: '500' }, loader: { marginTop: 50 },
  empty: { alignItems: 'center', padding: 28, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, emptyTitle: { color: colors.textPrimary, fontSize: 18, lineHeight: 27, fontWeight: '600' }, emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 19.5, textAlign: 'center', marginTop: 7 }, emptyButton: { marginTop: 18, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: colors.accent }, emptyButtonText: { color: colors.onAccent, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: colors.modalOverlay }, modal: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, modalTitle: { color: colors.textPrimary, fontSize: 21, lineHeight: 31.5, fontWeight: '600', marginBottom: 14 },
  input: { minHeight: 47, marginBottom: 9, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.textPrimary, fontSize: 13 }, placeholder: { color: colors.textMuted }, fieldLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 15, fontWeight: '700', letterSpacing: 1, marginTop: 8, marginBottom: 8 },
  frequencyRow: { flexDirection: 'row', gap: 8 }, frequency: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11, borderWidth: 1, borderColor: colors.border }, frequencyActive: { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }, frequencyText: { color: colors.textMuted, fontSize: 11, lineHeight: 16.5, fontWeight: '600' }, frequencyTextActive: { color: colors.accent },
  weekdays: { flexDirection: 'row', gap: 5, marginTop: 10 }, weekday: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9, backgroundColor: colors.background }, weekdayActive: { backgroundColor: colors.accent }, weekdayText: { color: colors.textMuted, fontSize: 9, lineHeight: 13.5, fontWeight: '600' }, weekdayTextActive: { color: colors.onAccent },
  actions: { flexDirection: 'row', gap: 9, marginTop: 20 }, cancel: { flex: 1, alignItems: 'center', padding: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, cancelText: { color: colors.textMuted, fontWeight: '600' }, save: { flex: 1, alignItems: 'center', padding: 13, borderRadius: 12, backgroundColor: colors.accent }, saveText: { color: colors.onAccent, fontWeight: '700' }, disabled: { opacity: 0.45 },
});
