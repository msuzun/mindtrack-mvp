import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { ProgramGraduationSummary } from '../types';

export function ProgramGraduationModal({ summary, onClose }: { summary: ProgramGraduationSummary | null; onClose: () => void }) {
  const styles = useThemedStyles(createStyles);
  return <Modal visible={Boolean(summary)} transparent animationType="fade" onRequestClose={onClose}><View style={styles.overlay}><View style={styles.card}>
    <Text style={styles.icon}>✦</Text><Text style={styles.eyebrow}>PROGRAM TAMAMLANDI</Text><Text style={styles.title}>Tebrikler!</Text><Text style={styles.name}>{summary?.title}</Text>
    <View style={styles.stats}><Stat value={String(summary?.totalItems ?? 0)} label="Çözülen öğe" /><Stat value={`${summary?.focusMinutes ?? 0} dk`} label="Odak süresi" /><Stat value={summary?.accuracyChange == null ? '—' : `${summary.accuracyChange >= 0 ? '+' : ''}%${summary.accuracyChange}`} label="Doğruluk trendi" /></View>
    <View style={styles.certificate}><Text style={styles.certificateText}>🏅 {summary?.badge}</Text></View>
    <Pressable onPress={onClose} style={styles.button}><Text style={styles.buttonText}>Akademiye Dön</Text></Pressable>
  </View></View></Modal>;
}
function Stat({ value, label }: { value: string; label: string }) { const styles = useThemedStyles(createStyles); return <View style={styles.stat}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>; }
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: colors.modalOverlay }, card: { padding: 24, alignItems: 'center', borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  icon: { color: colors.warning, fontSize: 42 }, eyebrow: { color: colors.success, fontSize: 9, fontWeight: '800', letterSpacing: 1.4, marginTop: 6 }, title: { color: colors.textPrimary, fontSize: 28, fontWeight: '700', marginTop: 7 }, name: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 },
  stats: { width: '100%', flexDirection: 'row', gap: 6, marginTop: 20 }, stat: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: colors.background }, value: { color: colors.accent, fontSize: 15, fontWeight: '800' }, label: { color: colors.textMuted, fontSize: 8, textAlign: 'center', marginTop: 4 },
  certificate: { marginTop: 16, padding: 12, borderRadius: radii.card, borderWidth: 1, borderColor: colors.warning }, certificateText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' }, button: { width: '100%', alignItems: 'center', padding: 13, marginTop: 20, borderRadius: radii.pill, backgroundColor: colors.accent }, buttonText: { color: colors.onAccent, fontWeight: '800' },
});
