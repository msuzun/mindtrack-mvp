import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { SmartSuggestion } from '../types';

export function SmartSuggestionBanner({ suggestion, busy, onApply, onAlternative, onDismiss }: {
  suggestion: SmartSuggestion;
  busy?: boolean;
  onApply: () => void;
  onAlternative?: () => void;
  onDismiss: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.card}>
    <View style={styles.header}><Text style={styles.spark}>✦</Text><Text style={styles.eyebrow}>AKILLI PLANLAMA</Text></View>
    <Text style={styles.message}>{suggestion.message}</Text>
    <View style={styles.actions}>
      <Pressable disabled={busy} onPress={onApply} style={styles.apply}><Text style={styles.applyText}>{suggestion.type === 'reschedule' ? 'Bugüne Al' : 'Uygula'}</Text></Pressable>
      {suggestion.type === 'reschedule' && onAlternative && <Pressable disabled={busy} onPress={onAlternative} style={styles.alternative}><Text style={styles.alternativeText}>Boş Güne</Text></Pressable>}
    </View>
    <Pressable disabled={busy} onPress={onDismiss} style={styles.dismiss}><Text style={styles.dismissText}>Şimdilik Kalsın</Text></Pressable>
  </View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { padding: 15, borderRadius: radii.card, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface, marginBottom: 15, shadowColor: colors.accent, shadowOpacity: .13, shadowRadius: 12, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7 }, spark: { color: colors.accent, fontSize: 15 }, eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  message: { color: colors.textPrimary, fontSize: 13, lineHeight: 20, fontWeight: '600', marginTop: 9 }, actions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  apply: { minHeight: 40, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.accent }, applyText: { color: colors.onAccent, fontSize: 12, fontWeight: '800' },
  alternative: { minHeight: 40, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, borderWidth: 1, borderColor: colors.success }, alternativeText: { color: colors.success, fontSize: 12, fontWeight: '800' },
  dismiss: { minHeight: 38, alignItems: 'center', justifyContent: 'center' }, dismissText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
});
