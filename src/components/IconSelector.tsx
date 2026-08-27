import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIconId } from '../services/AppIconService';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';

const ICONS: Array<{ id: AppIconId; label: string; source: ImageSourcePropType }> = [
  { id: 'zen-blue', label: 'Zen Blue', source: require('../../assets/app-icons/icon-zen-blue.png') },
  { id: 'midnight', label: 'Midnight', source: require('../../assets/app-icons/icon-midnight.png') },
  { id: 'pure-light', label: 'Pure Light', source: require('../../assets/app-icons/icon-pure-light.png') },
  { id: 'solar-sunset', label: 'Solar', source: require('../../assets/app-icons/icon-solar-sunset.png') },
];

export function IconSelector({ selected, disabled, onSelect }: {
  selected: AppIconId;
  disabled?: boolean;
  onSelect: (id: AppIconId) => void;
}) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.grid} accessibilityRole="radiogroup">
    {ICONS.map((icon) => {
      const active = icon.id === selected;
      return <Pressable key={icon.id} disabled={disabled} onPress={() => onSelect(icon.id)} accessibilityRole="radio"
        accessibilityState={{ checked: active, disabled }} style={[styles.option, active && styles.optionSelected]}>
        <Image source={icon.source} style={styles.icon} resizeMode="cover" />
        <Text style={[styles.label, active && styles.labelSelected]}>{icon.label}</Text>
        {active && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
      </Pressable>;
    })}
  </View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  grid: { flexDirection: 'row', gap: 9, marginBottom: 24 },
  option: { flex: 1, minWidth: 0, padding: 7, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  optionSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceRaised },
  icon: { width: 52, height: 52, borderRadius: 13 },
  label: { color: colors.textMuted, fontSize: 9, lineHeight: 13.5, fontWeight: '600', textAlign: 'center', marginTop: 7 },
  labelSelected: { color: colors.textPrimary },
  check: { position: 'absolute', right: 3, top: 3, width: 18, height: 18, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  checkText: { color: colors.onAccent, fontSize: 10, lineHeight: 14, fontWeight: '800' },
});
