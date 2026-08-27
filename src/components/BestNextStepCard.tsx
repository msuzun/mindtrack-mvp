import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { Task } from '../types';

export function BestNextStepCard({ task, onStart }: { task: Task | null; onStart: (task: Task) => void }) {
  const styles = useThemedStyles(createStyles);
  if (!task) return null;
  const minutes = Math.max(5, task.targetMinutes || 15);
  return (
    <View style={styles.card} accessibilityLabel={`Öneri: ${minutes} dakika ${task.title}`}>
      <View style={styles.badge}><Text style={styles.badgeText}>ÖNERİ</Text></View>
      <Text style={styles.title}>Şu an en uygun adım: {minutes} Dk {task.title}</Text>
      <Text style={styles.hint}>Önceliğin, kalan süren ve geçmiş odak ritmine göre seçildi.</Text>
      <Pressable onPress={() => onStart(task)} style={({ pressed }) => [styles.button, pressed && styles.pressed]} accessibilityRole="button">
        <Text style={styles.buttonText}>Hemen Başla →</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { padding: 16, marginBottom: 14, borderRadius: radii.card, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: colors.illustrationGlowPrimary },
  badgeText: { color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 16, lineHeight: 23, fontWeight: '700', marginTop: 10 },
  hint: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  button: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: 15, marginTop: 13, borderRadius: radii.pill, backgroundColor: colors.accent },
  buttonText: { color: colors.onAccent, fontSize: 12, fontWeight: '800' }, pressed: { opacity: 0.82 },
});
