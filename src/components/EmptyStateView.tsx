import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { AllDoneIllustration, NoResultsIllustration, ZeroTaskIllustration } from './EmptyStateIllustrations';
import { Floating } from './Floating';

export type EmptyStateType = 'empty' | 'completed' | 'no-results';

const content: Record<EmptyStateType, { title: string; description: string; actionLabel: string }> = {
  empty: {
    title: 'Zihnin Tertemiz',
    description: 'Bugün odaklanmak istediğin ilk görevi ekleyerek güne harika bir başlangıç yap.',
    actionLabel: '+ İlk Görevini Ekle',
  },
  completed: {
    title: 'Günün Görevleri Tamamlandı!',
    description: 'Bugün için yapacak bir şey kalmadı. Şimdi arkana yaslanıp dinlenme zamanı.',
    actionLabel: 'İlerlemeyi Gör',
  },
  'no-results': {
    title: 'Sonuç Bulunamadı',
    description: 'Aradığın kelimeyle eşleşen bir görev bulamadık. Filtreleri temizlemeyi deneyebilirsin.',
    actionLabel: 'Aramayı Temizle',
  },
};

export function EmptyStateView({ type, title, description, actionLabel, onAction }: {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const defaults = content[type];
  const Illustration = type === 'empty'
    ? ZeroTaskIllustration
    : type === 'completed' ? AllDoneIllustration : NoResultsIllustration;

  return <View style={styles.container} accessibilityRole="summary">
    <Floating><Illustration /></Floating>
    <Text style={styles.title}>{title ?? defaults.title}</Text>
    <Text style={styles.description}>{description ?? defaults.description}</Text>
    {onAction && <Pressable onPress={onAction} accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <Text style={styles.buttonText}>{actionLabel ?? defaults.actionLabel}</Text>
    </Pressable>}
  </View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 18 },
  title: { color: colors.textPrimary, fontSize: 21, lineHeight: 28, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 310, marginTop: 7 },
  button: { minHeight: 45, marginTop: 18, paddingHorizontal: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accent, borderRadius: radii.pill, shadowColor: colors.accent,
    shadowOpacity: 0.22, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  buttonText: { color: colors.onAccent, fontSize: 13, fontWeight: '800' },
});
