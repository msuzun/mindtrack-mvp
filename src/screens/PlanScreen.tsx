import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { addDays, toLocalDateKey } from '../utils/date';

export function PlanScreen() {
  const { selectedDate, setSelectedDate, setTab } = useAppStore();
  const today = toLocalDateKey();

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const openDay = (date: string) => {
    setSelectedDate(date);
    setTab('today');
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Plan</Text>
      <Text style={styles.subtitle}>
        MVP'de günlük planlar otomatik üretilir. Haftalık görünümden istediğin güne geçebilirsin.
      </Text>

      <Text style={styles.section}>Önümüzdeki 7 Gün</Text>

      {days.map((date, index) => (
        <Pressable
          key={date}
          onPress={() => openDay(date)}
          style={[styles.day, selectedDate === date && styles.selected]}
        >
          <View>
            <Text style={styles.dayTitle}>{index === 0 ? 'Bugün' : `Gün +${index}`}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Yıllık yapı</Text>
        <Text style={styles.infoText}>
          Yıl → Ay → Hafta → Gün → Görev hiyerarşisi sonraki iterasyonda
          kişiselleştirilebilir plan tablolarıyla genişletilecek. Bu sürüm,
          günlük disiplin ve kayıt altyapısını doğrular.
        </Text>
      </View>
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
    color: '#6c7280',
    lineHeight: 20,
  },
  section: {
    marginTop: 28,
    marginBottom: 10,
    fontSize: 17,
    fontWeight: '900',
  },
  day: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6e8ec',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selected: {
    borderColor: '#252a34',
    borderWidth: 2,
  },
  dayTitle: {
    fontWeight: '900',
    fontSize: 16,
  },
  date: {
    marginTop: 3,
    color: '#747a85',
  },
  arrow: {
    fontSize: 30,
    color: '#838995',
  },
  info: {
    marginTop: 22,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#eef0f3',
  },
  infoTitle: {
    fontWeight: '900',
    marginBottom: 6,
  },
  infoText: {
    color: '#606672',
    lineHeight: 20,
  },
});
