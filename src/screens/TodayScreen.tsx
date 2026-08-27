import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyStateView } from '../components/EmptyStateView';
import { TaskCard } from '../components/TaskCard';
import { ZenFocusModal } from '../components/ZenFocusModal';
import { TaskCustomizationModal } from '../components/TaskCustomizationModal';
import { PerformanceInput, PerformanceInputSheet } from '../components/PerformanceInputSheet';
import { useAppStore } from '../store/useAppStore';
import { useTodayTasks } from '../hooks/useTodayTasks';
import { radii, spacing, ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { Task } from '../types';
import { TrainingSessionService } from '../services/TrainingSessionService';

export function TodayScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { tasks, loading, toggleTask, selectedDate, loadDay } = useTodayTasks();
  const setTab = useAppStore((state) => state.setTab);
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [customizingTask, setCustomizingTask] = useState<Task | null>(null);
  const [performanceTask, setPerformanceTask] = useState<Task | null>(null);
  const [performanceDuration, setPerformanceDuration] = useState(0);
  const [taskRenderNonce, setTaskRenderNonce] = useState(0);

  const requestTaskToggle = async (task: Task) => {
    if (task.completed) {
      await toggleTask(task);
      return;
    }
    setPerformanceDuration(0);
    setPerformanceTask(task);
  };

  const completePerformanceTask = async (input?: PerformanceInput) => {
    if (!performanceTask) return;
    if (input) {
      await TrainingSessionService.save({
        taskInstanceId: performanceTask.id,
        ...input,
      });
    }
    await toggleTask(performanceTask);
    setPerformanceTask(null);
  };

  const dismissPerformance = () => {
    setPerformanceTask(null);
    setTaskRenderNonce((value) => value + 1);
  };

  const completed = tasks.filter((x) => x.completed).length;
  const total = tasks.length;
  const completedMinutes = tasks
    .filter((x) => x.completed)
    .reduce((sum, x) => sum + x.targetMinutes, 0);
  const totalMinutes = tasks.reduce((sum, x) => sum + x.targetMinutes, 0);
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={colors.accent} />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.dateBadge}>
          <Text style={styles.kicker}>{selectedDate}</Text>
        </View>
        <Text style={styles.title}>Bugünün Planı</Text>
        <Text style={styles.subtitle}>Odağını koru, küçük adımlarla ilerle.</Text>
      </View>

      {total > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>GÜNLÜK İLERLEME</Text>
              <Text style={styles.summaryValue}>{completed}/{total} görev</Text>
            </View>
            <Text style={styles.percent}>%{percent}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` as `${number}%` }]} />
          </View>
          <Text style={styles.minutes}>{completedMinutes}/{totalMinutes} dakika tamamlandı</Text>
        </View>
      )}

      {total === 0 ? (
        <EmptyStateView type="empty" />
      ) : completed === total ? (
        <EmptyStateView type="completed" onAction={() => setTab('progress')} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Bugünkü görevler</Text>
          {tasks.map((task) => (
            <TaskCard
              key={`${task.id}-${taskRenderNonce}`}
              task={task}
              onToggle={() => void requestTaskToggle(task)}
              onFocus={() => setFocusedTask(task)}
              onCustomize={() => setCustomizingTask(task)}
            />
          ))}
        </>
      )}
      {focusedTask && (
        <ZenFocusModal
          task={focusedTask}
          onClose={() => setFocusedTask(null)}
          onComplete={async (durationSeconds) => {
            setPerformanceDuration(durationSeconds);
            setPerformanceTask(focusedTask);
          }}
        />
      )}
      {customizingTask && (
        <TaskCustomizationModal
          task={customizingTask}
          onClose={() => setCustomizingTask(null)}
          onSaved={() => loadDay(selectedDate)}
        />
      )}
      <PerformanceInputSheet
        visible={Boolean(performanceTask)}
        task={performanceTask}
        initialDurationSeconds={performanceDuration}
        onSave={completePerformanceTask}
        onSkip={() => completePerformanceTask()}
        onDismiss={dismissPerformance}
      />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  loader: { marginTop: 60 },
  content: { paddingHorizontal: spacing.screen, paddingTop: 18, paddingBottom: 36 },
  header: { marginBottom: 20 },
  dateBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radii.pill, backgroundColor: colors.surface,
  },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  title: { marginTop: 12, fontSize: 30, lineHeight: 38, fontWeight: '700', color: colors.textPrimary },
  subtitle: { marginTop: 4, color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  summaryCard: {
    padding: spacing.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, marginBottom: spacing.section,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  summaryLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  summaryValue: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 5 },
  percent: { color: colors.accent, fontSize: 28, fontWeight: '700' },
  progressTrack: {
    height: 8, backgroundColor: colors.background, borderRadius: radii.pill,
    marginTop: 16, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: radii.pill },
  minutes: { marginTop: 9, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
});
