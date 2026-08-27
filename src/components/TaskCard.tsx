import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { HapticService } from '../services/HapticService';
import { radii, ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { Task } from '../types';
import { CompletionSparkle } from './CompletionSparkle';

const categoryLabel = {
  memory: 'HAFIZA',
  cognitive: 'BİLİŞSEL',
  spiritual: 'ODAK / DUA',
};

export function TaskCard({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const checkboxScale = useRef(new Animated.Value(1)).current;
  const strikeProgress = useRef(new Animated.Value(task.completed ? 1 : 0)).current;
  const [sparkleTrigger, setSparkleTrigger] = useState(0);
  const [visualCompleted, setVisualCompleted] = useState(task.completed);

  useEffect(() => {
    setVisualCompleted(task.completed);
    if (!task.completed) strikeProgress.setValue(0);
  }, [strikeProgress, task.completed]);

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
    <Pressable
      onPress={handlePress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: task.completed }}
      accessibilityLabel={task.title + ', ' + task.targetMinutes + ' dakika'}
      style={({ pressed }) => [styles.card, visualCompleted && styles.doneCard, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <Animated.View style={[
          styles.checkbox,
          visualCompleted && styles.checkboxDone,
          { transform: [{ scale: checkboxScale }] },
        ]}>
          <Text style={styles.check}>{visualCompleted ? '✓' : ''}</Text>
        </Animated.View>
        <View style={styles.content}>
          <Text style={[styles.category, visualCompleted && styles.categoryDone]}>{categoryLabel[task.category]}</Text>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, visualCompleted && styles.doneText]}>{task.title}</Text>
            <Animated.View style={[styles.strikeLine, { transform: [{ scaleX: strikeProgress }] }]} />
          </View>
          <Text style={styles.description}>{task.description}</Text>
        </View>
        <View style={styles.timeBadge}>
          <Text style={styles.minutes}>{task.targetMinutes} dk</Text>
        </View>
      </View>
      <CompletionSparkle trigger={sparkleTrigger} />
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
  titleWrap: { alignSelf: 'stretch', position: 'relative' },
  doneText: { color: colors.textMuted },
  strikeLine: {
    position: 'absolute', left: 0, right: 0, top: '52%', height: 2,
    borderRadius: 1, backgroundColor: colors.success, transformOrigin: 'left center',
  },
  description: { marginTop: 5, lineHeight: 20, color: colors.textMuted, fontSize: 13 },
  timeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised },
  minutes: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
});
