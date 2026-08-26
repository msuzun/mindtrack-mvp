import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Task } from '../types';

const categoryLabel = {
  memory: '🧠 HAFIZA',
  cognitive: '🧩 BİLİŞSEL',
  spiritual: '🧘 ODAK / DUA',
};

export function TaskCard({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.card, task.completed && styles.doneCard]}
    >
      <View style={styles.row}>
        <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
          <Text style={styles.check}>{task.completed ? '✓' : ''}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>{categoryLabel[task.category]}</Text>
          <Text style={[styles.title, task.completed && styles.doneText]}>
            {task.title}
          </Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        <Text style={styles.minutes}>{task.targetMinutes} dk</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e6e8ec',
  },
  doneCard: {
    opacity: 0.65,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#252a34',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: '#252a34',
  },
  check: {
    color: '#fff',
    fontWeight: '800',
  },
  content: {
    flex: 1,
    marginHorizontal: 12,
  },
  category: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6c7280',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171a21',
  },
  doneText: {
    textDecorationLine: 'line-through',
  },
  description: {
    marginTop: 5,
    lineHeight: 18,
    color: '#707681',
    fontSize: 13,
  },
  minutes: {
    fontWeight: '700',
    color: '#555c68',
  },
});
