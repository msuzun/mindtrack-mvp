import { StyleSheet, Text, View } from 'react-native';
import { DailyCompletionStats } from '../types';
import { ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { toLocalDateKey } from '../utils/date';

const labels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function WeeklyBarChart({ data }: { data: DailyCompletionStats[] }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const today = toLocalDateKey();
  const hasProgress = data.some((item) => item.completed > 0);

  return <View>
    <View style={styles.chart}>
      {data.map((item, index) => {
        const isToday = item.date === today;
        const height = Math.max(4, Math.round(item.completionRate * 0.78));
        return <View key={item.date} style={styles.column}>
          <Text style={[styles.value, isToday && styles.todayText]}>%{item.completionRate}</Text>
          <View style={styles.track}>
            <View style={[styles.bar, { height, backgroundColor: isToday ? colors.accent : colors.success }, isToday && styles.todayBar]} />
          </View>
          <Text style={[styles.day, isToday && styles.todayText]}>{labels[index]}</Text>
        </View>;
      })}
    </View>
    {!hasProgress && <Text style={styles.empty}>Bu hafta için küçük bir başlangıç yapmaya ne dersin?</Text>}
  </View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  chart: { height: 126, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  column: { flex: 1, alignItems: 'center' },
  value: { color: colors.textMuted, fontSize: 8, fontWeight: '700', marginBottom: 4 },
  track: { width: 18, height: 80, justifyContent: 'flex-end', borderRadius: 7, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 7 },
  todayBar: { shadowColor: colors.accent, shadowOpacity: 0.7, shadowRadius: 7, elevation: 5 },
  day: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginTop: 7 },
  todayText: { color: colors.accent },
  empty: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 9 },
});
