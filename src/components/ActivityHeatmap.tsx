import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityDay } from '../types';
import { ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { addDays, toLocalDateKey } from '../utils/date';

const formatDate = (dateKey: string) => new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric', month: 'long',
}).format(new Date(`${dateKey}T12:00:00`));

export function ActivityHeatmap({ data, days = 60 }: { data: ActivityDay[]; days?: number }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [selectedDate, setSelectedDate] = useState(toLocalDateKey());
  const cells = useMemo(() => {
    const counts = new Map(data.map((item) => [item.date, item.completed]));
    const start = addDays(toLocalDateKey(), -(days - 1));
    return Array.from({ length: days }, (_, index) => {
      const date = addDays(start, index);
      return { date, completed: counts.get(date) ?? 0 };
    });
  }, [data, days]);
  const selected = cells.find((item) => item.date === selectedDate) ?? cells[cells.length - 1]!;
  const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, index) => cells.slice(index * 7, index * 7 + 7));

  const cellColor = (count: number) => {
    if (count === 0) return colors.surfaceRaised;
    if (count <= 2) return colors.heatmapLow;
    if (count <= 4) return colors.heatmapMedium;
    return colors.success;
  };

  return (
    <View>
      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => <View key={weekIndex} style={styles.week}>
          {week.map((item) => <Pressable key={item.date} onPress={() => setSelectedDate(item.date)}
            accessibilityRole="button" accessibilityLabel={`${formatDate(item.date)}, ${item.completed} görev tamamlandı`}
            style={[styles.cell, { backgroundColor: cellColor(item.completed) }, selectedDate === item.date && styles.selected]} />)}
        </View>)}
      </View>
      <Text style={styles.summary}>{formatDate(selected.date)}: {selected.completed} görev tamamlandı</Text>
      {data.length === 0 && <Text style={styles.empty}>İlk tamamladığın görev burada yeni bir iz bırakacak.</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  grid: { flexDirection: 'row', gap: 5, justifyContent: 'space-between' },
  week: { gap: 5 },
  cell: { width: 17, height: 17, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  selected: { borderColor: colors.accent, borderWidth: 2, transform: [{ scale: 1.08 }] },
  summary: { color: colors.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 14 },
  empty: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
});
