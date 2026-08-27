import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { CircularProgress } from '../components/CircularProgress';
import { WeeklyBarChart } from '../components/WeeklyBarChart';
import {
  getActivityHeatmapData,
  getStats,
  getWeeklyStats,
} from '../db/database';
import { ActivityDay, DailyCompletionStats, PeriodStats } from '../types';
import { radii, spacing, ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { addDays, endOfWeek, startOfWeek, toLocalDateKey } from '../utils/date';

const emptySummary: PeriodStats = {
  total: 0, completed: 0, completionRate: 0, plannedMinutes: 0, completedMinutes: 0,
};

export function ProgressScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(emptySummary);
  const [week, setWeek] = useState<DailyCompletionStats[]>([]);
  const [activity, setActivity] = useState<ActivityDay[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const todayKey = toLocalDateKey();
      const weekStart = startOfWeek(todayKey);
      const weekEnd = endOfWeek(todayKey);
      const heatmapStart = addDays(todayKey, -59);
      const [todaySummary, weeklyRows, activityRows] = await Promise.all([
        getStats(todayKey, todayKey),
        getWeeklyStats(weekStart, weekEnd),
        getActivityHeatmapData(heatmapStart, todayKey),
      ]);
      if (!active) return;

      const byDate = new Map(weeklyRows.map((item) => [item.date, item]));
      const completeWeek = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index);
        return byDate.get(date) ?? { date, total: 0, completed: 0, completionRate: 0 };
      });
      setToday(todaySummary);
      setWeek(completeWeek);
      setActivity(activityRows);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color={colors.accent} />;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>ANALİTİK & İLERLEME</Text>
      <Text style={styles.title}>İlerleme</Text>
      <Text style={styles.subtitle}>Her küçük tamamlanma, istikrarlı bir ritmin parçası.</Text>

      <View style={[styles.card, styles.heroCard]}>
        <View style={styles.heroCopy}>
          <Text style={styles.cardEyebrow}>BUGÜN</Text>
          <Text style={styles.cardTitle}>Günlük odağın</Text>
          <Text style={styles.cardText}>
            {today.completed > 0
              ? `${today.completedMinutes} dakikalık hedef tamamlandı.`
              : 'İlk görevinle bugünün ritmini başlat.'}
          </Text>
        </View>
        <CircularProgress percent={today.completionRate} completed={today.completed} total={today.total} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>BU HAFTA</Text>
        <Text style={styles.cardTitle}>Tamamlama ritmi</Text>
        <Text style={styles.cardText}>Pazartesiden pazara günlük tamamlanma oranı.</Text>
        <WeeklyBarChart data={week} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardEyebrow}>SON 60 GÜN</Text>
            <Text style={styles.cardTitle}>Aktivite haritası</Text>
          </View>
          <View style={styles.legend}>
            <Text style={styles.legendText}>Az</Text>
            {[colors.surfaceRaised, colors.heatmapLow, colors.heatmapMedium, colors.success].map((color) =>
              <View key={color} style={[styles.legendCell, { backgroundColor: color }]} />)}
            <Text style={styles.legendText}>Çok</Text>
          </View>
        </View>
        <Text style={styles.cardText}>Bir güne dokunarak tamamlanan görev sayısını gör.</Text>
        <ActivityHeatmap data={activity} />
      </View>

      <View style={styles.privacyNote}>
        <Text style={styles.privacyText}>Tüm istatistikler yalnızca cihazındaki SQLite verilerinden hesaplanır.</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  loader: { marginTop: 60 },
  content: { paddingHorizontal: spacing.screen, paddingTop: 22, paddingBottom: 38 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  title: { marginTop: 7, fontSize: 30, lineHeight: 38, fontWeight: '700', color: colors.textPrimary },
  subtitle: { marginTop: 6, marginBottom: 22, color: colors.textMuted, lineHeight: 21, fontSize: 14 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.card, padding: spacing.card, marginBottom: 13 },
  heroCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroCopy: { flex: 1, paddingRight: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardEyebrow: { color: colors.success, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 5 },
  cardText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 15 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  legendCell: { width: 10, height: 10, borderRadius: 3 },
  legendText: { color: colors.textMuted, fontSize: 8, fontWeight: '600', marginHorizontal: 2 },
  privacyNote: { paddingHorizontal: 10, paddingTop: 5 },
  privacyText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
