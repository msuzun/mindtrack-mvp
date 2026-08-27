import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ensureTasksForRange, getStats } from '../db/database';
import { radii, spacing, ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { PeriodStats } from '../types';
import { endOfWeek, monthRange, startOfWeek, toLocalDateKey, yearRange } from '../utils/date';

const emptyStats: PeriodStats = {
  total: 0, completed: 0, completionRate: 0, plannedMinutes: 0, completedMinutes: 0,
};

function StatCard({ title, stats }: { title: string; stats: PeriodStats }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.big}>%{stats.completionRate}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${stats.completionRate}%` as `${number}%` }]} />
      </View>
      <View style={styles.metaRow}>
        <View>
          <Text style={styles.metaLabel}>GÖREV</Text>
          <Text style={styles.metaValue}>{stats.completed}/{stats.total}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View>
          <Text style={styles.metaLabel}>SÜRE</Text>
          <Text style={styles.metaValue}>{stats.completedMinutes}/{stats.plannedMinutes} dk</Text>
        </View>
      </View>
    </View>
  );
}

export function ProgressScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [week, setWeek] = useState(emptyStats);
  const [month, setMonth] = useState(emptyStats);
  const [year, setYear] = useState(emptyStats);

  useEffect(() => {
    void (async () => {
      const today = toLocalDateKey();
      await ensureTasksForRange(today, 7);
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);
      const [monthStart, monthEnd] = monthRange(today);
      const [yearStart, yearEnd] = yearRange(today);
      setWeek(await getStats(weekStart, weekEnd));
      setMonth(await getStats(monthStart, monthEnd));
      setYear(await getStats(yearStart, yearEnd));
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>PERFORMANS ÖZETİ</Text>
      <Text style={styles.title}>İlerleme</Text>
      <Text style={styles.subtitle}>
        Tamamlama oranı gelişimini görünür kılar; tek bir kötü gün bütün ilerlemeyi sıfırlamaz.
      </Text>
      <StatCard title="Bu Hafta" stats={week} />
      <StatCard title="Bu Ay" stats={month} />
      <StatCard title="Bu Yıl" stats={year} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 22, paddingBottom: 36 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  title: { marginTop: 7, fontSize: 30, lineHeight: 38, fontWeight: '700', color: colors.textPrimary },
  subtitle: { marginTop: 6, marginBottom: 22, color: colors.textMuted, lineHeight: 21, fontSize: 14 },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.card, padding: spacing.card, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  big: { fontSize: 30, fontWeight: '700', color: colors.accent },
  progressTrack: {
    height: 7, borderRadius: radii.pill, backgroundColor: colors.background,
    overflow: 'hidden', marginTop: 14,
  },
  progressFill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.success },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  metaDivider: { width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: 22 },
  metaLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  metaValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 3 },
});
