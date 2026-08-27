import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { Task } from '../types';

const categoryLabel = {
  memory: 'HAFIZA',
  cognitive: 'BİLİŞSEL',
  spiritual: 'ODAK / DUA',
};

export function TaskCard({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: task.completed }}
      accessibilityLabel={task.title + ', ' + task.targetMinutes + ' dakika'}
      style={({ pressed }) => [styles.card, task.completed && styles.doneCard, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
          <Text style={styles.check}>{task.completed ? '✓' : ''}</Text>
        </View>
        <View style={styles.content}>
          <Text style={[styles.category, task.completed && styles.categoryDone]}>{categoryLabel[task.category]}</Text>
          <Text style={[styles.title, task.completed && styles.doneText]}>{task.title}</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>
        <View style={styles.timeBadge}>
          <Text style={styles.minutes}>{task.targetMinutes} dk</Text>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radii.card, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border, shadowColor: colors.shadow, shadowOpacity: 0.14,
    shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2,
  },
  doneCard: { borderColor: colors.completedBorder, backgroundColor: colors.completedSurface },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: {
    width: 28, height: 28, borderRadius: 9, borderWidth: 1.5, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  check: { color: colors.onAccent, fontWeight: '800', fontSize: 16 },
  content: { flex: 1, marginHorizontal: 13 },
  category: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.accent, marginBottom: 5 },
  categoryDone: { color: colors.success },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 23, color: colors.textPrimary },
  doneText: { color: colors.textMuted, textDecorationLine: 'line-through' },
  description: { marginTop: 5, lineHeight: 20, color: colors.textMuted, fontSize: 13 },
  timeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised },
  minutes: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
});
