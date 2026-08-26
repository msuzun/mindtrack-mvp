import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TaskCard } from '../components/TaskCard';
import { useAppStore } from '../store/useAppStore';

export function TodayScreen() {
  const { tasks, loading, toggleTask, selectedDate } = useAppStore();

  const completed = tasks.filter((x) => x.completed).length;
  const total = tasks.length;
  const completedMinutes = tasks
    .filter((x) => x.completed)
    .reduce((sum, x) => sum + x.targetMinutes, 0);
  const totalMinutes = tasks.reduce((sum, x) => sum + x.targetMinutes, 0);
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>{selectedDate}</Text>
      <Text style={styles.title}>Bugünün Planı</Text>
      <Text style={styles.subtitle}>
        {completed}/{total} görev · {completedMinutes}/{totalMinutes} dk
      </Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.percent}>%{percent} tamamlandı</Text>

      <View style={styles.spacer} />

      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={() => void toggleTask(task)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  kicker: {
    color: '#757b86',
    fontWeight: '700',
  },
  title: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: '900',
    color: '#171a21',
  },
  subtitle: {
    marginTop: 6,
    color: '#6c7280',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e9ebef',
    borderRadius: 999,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#252a34',
  },
  percent: {
    marginTop: 7,
    fontWeight: '800',
    color: '#444a55',
  },
  spacer: {
    height: 20,
  },
});
