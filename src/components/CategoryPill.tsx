import { StyleSheet, Text, View } from 'react-native';
import { CategoryTag, PriorityLevel } from '../types';
import { radii } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

export const CATEGORY_TAGS: Array<{ value: CategoryTag; label: string }> = [
  { value: 'focus', label: 'Odaklanma' },
  { value: 'personal', label: 'Kişisel' },
  { value: 'work', label: 'İş / Proje' },
  { value: 'routine', label: 'Rutin' },
];

export function CategoryPill({ tag }: { tag: CategoryTag }) {
  const { colors, fontSizeScale } = useTheme();
  const palette = {
    focus: [colors.tagFocusBg, colors.tagFocusText],
    personal: [colors.tagPersonalBg, colors.tagPersonalText],
    work: [colors.tagWorkBg, colors.tagWorkText],
    routine: [colors.tagRoutineBg, colors.tagRoutineText],
  }[tag];
  const label = CATEGORY_TAGS.find((item) => item.value === tag)?.label ?? tag;
  return <View style={[styles.pill, { backgroundColor: palette[0] }]}><Text style={[styles.text, { color: palette[1], fontSize: 10 * fontSizeScale, lineHeight: 15 * fontSizeScale }]}>{label}</Text></View>;
}

export function PriorityIndicator({ level }: { level: PriorityLevel }) {
  const { colors } = useTheme();
  if (level === 0) return null;
  return <View accessibilityLabel={level === 2 ? 'Acil öncelik' : 'Önemli öncelik'} style={[
    styles.priority,
    { backgroundColor: level === 2 ? colors.priorityUrgent : colors.priorityImportant },
  ]} />;
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: radii.pill },
  text: { fontSize: 10, lineHeight: 15, fontWeight: '600', letterSpacing: 0.2 },
  priority: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: 2 },
});
