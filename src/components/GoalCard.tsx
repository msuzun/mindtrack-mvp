import { StyleSheet, Text, View } from 'react-native';
import { GoalOverview } from '../types';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';

function remainingLabel(targetDate: string | null) {
  if (!targetDate) return 'Bitiş tarihi yok';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${targetDate.slice(0, 10)}T12:00:00`);
  const days = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} gün geçti`;
  if (days === 0) return 'Son gün bugün';
  return `Son ${days} gün`;
}

export function GoalCard({ goal }: { goal: GoalOverview }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.title}>{goal.title}</Text>
      <Text style={styles.percent}>%{goal.progress}</Text>
    </View>
    <View style={styles.track}><View style={[styles.fill, { width: `${goal.progress}%` as `${number}%` }]} /></View>
    <View style={styles.metrics}>
      <Text style={styles.metric}>{goal.completedTasks}/{goal.totalTasks} görev</Text>
      <Text style={styles.metric}>{remainingLabel(goal.targetDate)}</Text>
    </View>
    {goal.routines.length > 0 && <View style={styles.routines}>
      {goal.routines.map((routine) => <View key={routine.id} style={styles.chip}><Text style={styles.chipText}>↻ {routine.title}</Text></View>)}
    </View>}
  </View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { padding: 18, marginBottom: 12, minHeight: 142, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, color: colors.textPrimary, fontSize: 17, lineHeight: 25.5, fontWeight: '600', letterSpacing: -0.1 },
  percent: { color: colors.accent, fontSize: 18, lineHeight: 27, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 7, marginTop: 15, overflow: 'hidden', borderRadius: radii.pill, backgroundColor: colors.background },
  fill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.success },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
  metric: { color: colors.textMuted, fontSize: 11, lineHeight: 16.5, fontWeight: '500' },
  routines: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13 },
  chip: { maxWidth: '100%', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised },
  chipText: { color: colors.textMuted, fontSize: 10, lineHeight: 15, fontWeight: '600' },
});
