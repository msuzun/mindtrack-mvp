import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ensureTasksForRange, getStats } from '../db/database';
import { PeriodStats } from '../types';
import {
  endOfWeek,
  monthRange,
  startOfWeek,
  toLocalDateKey,
  yearRange,
} from '../utils/date';

const emptyStats: PeriodStats = {
  total: 0,
  completed: 0,
  completionRate: 0,
  plannedMinutes: 0,
  completedMinutes: 0,
};

function StatCard({
  title,
  stats,
}: {
  title: string;
  stats: PeriodStats;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.big}>%{stats.completionRate}</Text>
      <Text style={styles.meta}>
        {stats.completed}/{stats.total} görev
      </Text>
      <Text style={styles.meta}>
        {stats.completedMinutes}/{stats.plannedMinutes} dk
      </Text>
    </View>
  );
}

export function ProgressScreen() {
  const [week, setWeek] = useState(emptyStats);
  const [month, setMonth] = useState(emptyStats);
  const [year, setYear] = useState(emptyStats);

  useEffect(() => {
    void (async () => {
      const today = toLocalDateKey();

      // MVP'de gelecek 7 günlük kayıtları oluştur; geçmiş günler zaten kullanım sırasında oluşur.
      await ensureTasksForRange(today, 7);

      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);
      const [monthStart, monthEnd] = monthRange(today);
      const [yearStart, yearEnd] = yearRange(today);

      setWeek(await getStats(weekStart, weekEnd));
      setMonth(await getStats(monthStart, monthEnd));
      setYear(await getStats(yearStart, yearEnd));
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>İlerleme</Text>
      <Text style={styles.subtitle}>
        Streak yerine tamamlama oranını da gösteriyoruz; bir kötü gün bütün ilerlemeyi sıfırlamaz.
      </Text>

      <StatCard title="Bu Hafta" stats={week} />
      <StatCard title="Bu Ay" stats={month} />
      <StatCard title="Bu Yıl" stats={year} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#171a21',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: '#6c7280',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6e8ec',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: '900',
    fontSize: 16,
  },
  big: {
    fontSize: 38,
    fontWeight: '900',
    marginTop: 8,
    color: '#171a21',
  },
  meta: {
    color: '#6c7280',
    marginTop: 3,
  },
});
