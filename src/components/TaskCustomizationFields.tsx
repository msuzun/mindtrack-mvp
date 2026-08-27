import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryTag, PriorityLevel } from '../types';
import { CATEGORY_TAGS, CategoryPill } from './CategoryPill';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';

export function TaskCustomizationFields({ categoryTag, priorityLevel, onCategoryChange, onPriorityChange }: {
  categoryTag: CategoryTag | null;
  priorityLevel: PriorityLevel;
  onCategoryChange: (value: CategoryTag | null) => void;
  onPriorityChange: (value: PriorityLevel) => void;
}) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.container}>
    <Text style={styles.label}>Kategori etiketi</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {CATEGORY_TAGS.map((item) => <Pressable key={item.value} onPress={() => onCategoryChange(categoryTag === item.value ? null : item.value)}
        style={[styles.chip, categoryTag === item.value && styles.selectedChip]} accessibilityRole="radio" accessibilityState={{ checked: categoryTag === item.value }}>
        <CategoryPill tag={item.value} />
      </Pressable>)}
    </ScrollView>
    <Text style={styles.label}>Öncelik</Text>
    <View style={styles.priorityRow}>
      {([[0, 'Normal'], [1, 'Önemli'], [2, 'Acil']] as Array<[PriorityLevel, string]>).map(([value, label]) => <Pressable key={value}
        onPress={() => onPriorityChange(value)} style={[styles.priorityChip, priorityLevel === value && styles.selectedPriority]} accessibilityRole="radio" accessibilityState={{ checked: priorityLevel === value }}>
        <View style={[styles.dot, value === 1 && styles.important, value === 2 && styles.urgent]} />
        <Text style={[styles.priorityText, priorityLevel === value && styles.selectedPriorityText]}>{label}</Text>
      </Pressable>)}
    </View>
  </View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: 10 }, label: { color: colors.textMuted, fontSize: 11, lineHeight: 16.5, fontWeight: '600', letterSpacing: 0.5, marginTop: 5 },
  chips: { gap: 8, paddingVertical: 2 }, chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: 'transparent' },
  selectedChip: { borderColor: colors.accent }, priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  selectedPriority: { borderColor: colors.accent, backgroundColor: colors.surfaceRaised }, priorityText: { color: colors.textMuted, fontSize: 11, lineHeight: 16.5, fontWeight: '600' },
  selectedPriorityText: { color: colors.textPrimary }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textMuted },
  important: { backgroundColor: colors.priorityImportant }, urgent: { backgroundColor: colors.priorityUrgent },
});
