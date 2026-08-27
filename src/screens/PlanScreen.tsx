import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { radii, spacing, ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { addDays, toLocalDateKey } from '../utils/date';

export function PlanScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { selectedDate, setSelectedDate, setTab } = useAppStore();
  const today = toLocalDateKey();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const openDay = (date: string) => {
    setSelectedDate(date);
    setTab('today');
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>HAFTALIK GÖRÜNÜM</Text>
      <Text style={styles.title}>Plan</Text>
      <Text style={styles.subtitle}>
        Günlük planların otomatik hazırlanır. İncelemek istediğin günü seç.
      </Text>

      <Text style={styles.section}>Önümüzdeki 7 Gün</Text>
      {days.map((date, index) => {
        const isSelected = selectedDate === date;
        return (
          <Pressable
            key={date}
            onPress={() => openDay(date)}
            accessibilityRole="button"
            accessibilityLabel={(index === 0 ? 'Bugün' : 'Gün +' + index) + ', ' + date}
            style={({ pressed }) => [
              styles.day, isSelected && styles.selected, pressed && styles.pressed,
            ]}
          >
            <View style={[styles.dayIndex, isSelected && styles.dayIndexSelected]}>
              <Text style={[styles.dayIndexText, isSelected && styles.dayIndexTextSelected]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.dayContent}>
              <Text style={styles.dayTitle}>{index === 0 ? 'Bugün' : 'Gün +' + index}</Text>
              <Text style={styles.date}>{date}</Text>
            </View>
            <Text style={[styles.arrow, isSelected && styles.arrowSelected]}>›</Text>
          </Pressable>
        );
      })}

      <View style={styles.info}>
        <Text style={styles.infoEyebrow}>YOL HARİTASI</Text>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 22, paddingBottom: 36 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  title: { marginTop: 7, fontSize: 30, lineHeight: 38, fontWeight: '700', color: colors.textPrimary },
  subtitle: { marginTop: 6, color: colors.textMuted, lineHeight: 21, fontSize: 14 },
  section: { marginTop: 28, marginBottom: 12, color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  day: {
    minHeight: 76, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.card, padding: 14, marginBottom: 10, flexDirection: 'row',
    alignItems: 'center',
  },
  selected: { borderColor: colors.accent, backgroundColor: colors.surfaceRaised },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  dayIndex: {
    width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dayIndexSelected: { backgroundColor: colors.accent },
  dayIndexText: { color: colors.textMuted, fontWeight: '700' },
  dayIndexTextSelected: { color: colors.onAccent },
  dayContent: { flex: 1, marginLeft: 13 },
  dayTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  date: { marginTop: 3, color: colors.textMuted, fontSize: 12 },
  arrow: { fontSize: 28, color: colors.textMuted },
  arrowSelected: { color: colors.accent },
  info: {
    marginTop: 18, padding: spacing.card, borderRadius: radii.card,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  infoEyebrow: { color: colors.success, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  infoTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 17, marginTop: 6, marginBottom: 7 },
  infoText: { color: colors.textMuted, lineHeight: 21, fontSize: 13 },
});
