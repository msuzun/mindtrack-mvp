import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { UserEnrolledProgram } from '../types';

export function ActiveProgramCard({ enrollment, onPause, onResume }: { enrollment: UserEnrolledProgram; onPause: () => void; onResume: () => void }) {
  const styles = useThemedStyles(createStyles); const progress = enrollment.weekTotal ? Math.round(enrollment.weekCompleted / enrollment.weekTotal * 100) : 0;
  return <View style={styles.card}>
    <View style={styles.top}><Text style={styles.badge}>{enrollment.status === 'active' ? 'AKTİF PROGRAM' : 'DURAKLATILDI'}</Text><Text style={styles.week}>{enrollment.currentWeek}/{enrollment.durationWeeks}. Hafta</Text></View>
    <Text style={styles.title}>{enrollment.title}</Text>
    <Text style={styles.subtitle}>{enrollment.weekCompleted}/{enrollment.weekTotal} gün tamamlandı · %{progress}</Text>
    {progress >= 80 && <Text style={styles.milestone}>✦ Haftalık dönüm noktası hazır</Text>}
    <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` as `${number}%` }]} /></View>
    <Pressable onPress={enrollment.status === 'active' ? onPause : onResume} style={styles.action}><Text style={styles.actionText}>{enrollment.status === 'active' ? 'Duraklat' : 'Devam Et'}</Text></Pressable>
  </View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { padding: 16, marginBottom: 12, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  top: { flexDirection: 'row', justifyContent: 'space-between' }, badge: { color: colors.success, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, week: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  title: { color: colors.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '700', marginTop: 8 }, subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  milestone: { color: colors.warning, fontSize: 10, fontWeight: '700', marginTop: 7 },
  track: { height: 7, marginTop: 12, borderRadius: radii.pill, overflow: 'hidden', backgroundColor: colors.background }, fill: { height: '100%', backgroundColor: colors.success },
  action: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border }, actionText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
});
