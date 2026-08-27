import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { HapticService } from '../services/HapticService';
import { radii, ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { Task } from '../types';
import { CompletionSparkle } from './CompletionSparkle';
import { CategoryPill, PriorityIndicator } from './CategoryPill';
import { CategoryTag } from '../types';

const categoryLabel = {
  memory: 'HAFIZA',
  cognitive: 'BİLİŞSEL',
  spiritual: 'ODAK / DUA',
};

const fallbackTag: Record<Task['category'], CategoryTag> = { memory: 'focus', cognitive: 'work', spiritual: 'personal' };

export function TaskCard({ task, onToggle, onFocus, onCustomize }: {
  task: Task; onToggle: () => void; onFocus?: () => void; onCustomize?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const checkboxScale = useRef(new Animated.Value(1)).current;
  const strikeProgress = useRef(new Animated.Value(task.completed ? 1 : 0)).current;
  const [sparkleTrigger, setSparkleTrigger] = useState(0);
  const [visualCompleted, setVisualCompleted] = useState(task.completed);
  const cardOpacity = useRef(new Animated.Value(task.completed ? 0.6 : 1)).current;

  useEffect(() => {
    setVisualCompleted(task.completed);
    if (!task.completed) strikeProgress.setValue(0);
    Animated.timing(cardOpacity, { toValue: task.completed ? 0.6 : 1, duration: 240, useNativeDriver: true }).start();
  }, [cardOpacity, strikeProgress, task.completed]);

  const handlePress = () => {
    if (!task.completed) {
      setVisualCompleted(true);
      checkboxScale.stopAnimation();
      checkboxScale.setValue(1);
      strikeProgress.stopAnimation();
      strikeProgress.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.spring(checkboxScale, { toValue: 1.2, speed: 28, bounciness: 5, useNativeDriver: true }),
          Animated.spring(checkboxScale, { toValue: 1, speed: 22, bounciness: 7, useNativeDriver: true }),
        ]),
        Animated.timing(strikeProgress, { toValue: 1, duration: 360, useNativeDriver: true }),
      ]).start();
      setSparkleTrigger((value) => value + 1);
      void HapticService.taskCompleted();
    }
    onToggle();
  };

  return (
    <Animated.View style={[styles.card, visualCompleted && styles.doneCard, { opacity: cardOpacity }]}>
      <PriorityIndicator level={task.priorityLevel} />
      <Pressable
        onPress={handlePress}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={task.title + ', ' + task.targetMinutes + ' dakika'}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Animated.View style={[
          styles.checkbox,
          visualCompleted && styles.checkboxDone,
          { transform: [{ scale: checkboxScale }] },
        ]}>
          <Text style={styles.check}>{visualCompleted ? '✓' : ''}</Text>
        </Animated.View>
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <CategoryPill tag={task.categoryTag ?? fallbackTag[task.category]} />
            <Text style={styles.legacyCategory}>{categoryLabel[task.category]}</Text>
            {task.routineId && <Text style={styles.relationIcon} accessibilityLabel="Rutinden oluşturuldu">↻</Text>}
            {task.goalTitle && <Text style={styles.goalBadge} numberOfLines={1}>◎ {task.goalTitle}</Text>}
          </View>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, visualCompleted && styles.doneText]}>{task.title}</Text>
            <Animated.View style={[styles.strikeLine, { transform: [{ scaleX: strikeProgress }] }]} />
          </View>
          <Text style={styles.description}>{task.description}</Text>
        </View>
        <View style={styles.timeBadge}>
          <Text style={styles.minutes}>{task.targetMinutes} dk</Text>
        </View>
      </Pressable>
      {!visualCompleted && <View style={styles.cardActions}>
        {onFocus && <Pressable onPress={onFocus} style={styles.focusButton} accessibilityRole="button" accessibilityLabel={`${task.title} için odaklanmayı başlat`}>
          <Text style={styles.focusText}>◎ Odaklanmayı Başlat</Text>
        </Pressable>}
        {onCustomize && <Pressable onPress={onCustomize} style={styles.editButton} accessibilityRole="button" accessibilityLabel={`${task.title} kartını özelleştir`}>
          <Text style={styles.editText}>Özelleştir</Text>
        </Pressable>}
      </View>}
      <CompletionSparkle trigger={sparkleTrigger} />
    </Animated.View>
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  legacyCategory: { fontSize: 9, lineHeight: 13.5, fontWeight: '600', letterSpacing: 0.7, color: colors.textMuted },
  relationIcon: { color: colors.success, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  goalBadge: { flexShrink: 1, color: colors.accent, fontSize: 9, lineHeight: 13.5, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '600', lineHeight: 24, letterSpacing: -0.15, color: colors.textPrimary },
  titleWrap: { alignSelf: 'stretch', position: 'relative' },
  doneText: { color: colors.textMuted },
  strikeLine: {
    position: 'absolute', left: 0, right: 0, top: '52%', height: 2,
    borderRadius: 1, backgroundColor: colors.success, transformOrigin: 'left center',
  },
  description: { marginTop: 5, lineHeight: 19.5, color: colors.textMuted, fontSize: 13, fontWeight: '400', letterSpacing: 0.05 },
  timeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised },
  minutes: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginLeft: 41, gap: 8 },
  focusButton: {
    paddingVertical: 7,
    paddingHorizontal: 11, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised,
  },
  focusText: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  editButton: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: radii.pill },
  editText: { color: colors.textMuted, fontSize: 11, lineHeight: 16.5, fontWeight: '600' },
});
