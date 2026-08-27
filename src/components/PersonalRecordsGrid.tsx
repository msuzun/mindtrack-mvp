import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PersonalRecord, PersonalRecordType } from '../types';
import { RecordTrackerService } from '../services/RecordTrackerService';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';

const config: Record<PersonalRecordType, { icon: string; label: string; format: (value: number) => string }> = {
  max_items: { icon: '🏆', label: 'Maksimum Hatırlama', format: (v) => `${v} öğe` }, peak_accuracy: { icon: '🎯', label: 'Zirve Doğruluk', format: (v) => `%${v}` },
  longest_focus: { icon: '⏱', label: 'En Uzun Odak', format: (v) => `${v} dk` }, best_streak_week: { icon: '⚡', label: 'En Düzenli Hafta', format: (v) => `%${v}` },
};
const dateText = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

export function PersonalRecordsGrid() {
  const styles = useThemedStyles(createStyles); const [records, setRecords] = useState<PersonalRecord[]>([]);
  useEffect(() => { void RecordTrackerService.getRecords().then(setRecords); return RecordTrackerService.subscribe(() => void RecordTrackerService.getRecords().then(setRecords)); }, []);
  const byType = new Map(records.map((record) => [record.recordType, record]));
  return <View style={styles.shell}><Text style={styles.eyebrow}>KİŞİSEL REKORLAR</Text><Text style={styles.heading}>Emeğinin iz bıraktığı anlar</Text><View style={styles.grid}>
    {(Object.keys(config) as PersonalRecordType[]).map((type) => { const item = config[type]; const record = byType.get(type); return <View key={type} style={styles.cell}><Text style={styles.icon}>{item.icon}</Text><Text style={styles.value}>{record ? item.format(record.value) : '—'}</Text><Text style={styles.label}>{item.label}</Text><Text style={styles.date}>{record ? `${dateText(record.achievedAt)} tarihinde` : 'İlk ölçümünü bekliyor'}</Text></View>; })}
  </View></View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  shell: { padding: 16, marginBottom: 14, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, eyebrow: { color: colors.warning, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }, heading: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 5, marginBottom: 13 }, grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', minHeight: 120, padding: 12, borderWidth: .5, borderColor: colors.border }, icon: { fontSize: 18 }, value: { color: colors.accent, fontSize: 19, fontWeight: '800', marginTop: 6 }, label: { color: colors.textPrimary, fontSize: 10, fontWeight: '700', marginTop: 3 }, date: { color: colors.textMuted, fontSize: 8, lineHeight: 12, marginTop: 5 },
});
