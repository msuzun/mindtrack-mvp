import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type Tab = 'today' | 'plan' | 'progress' | 'settings' | 'about';

const tabs: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'today', label: 'Bugün', icon: '✓' },
  { key: 'plan', label: 'Plan', icon: '□' },
  { key: 'progress', label: 'İlerleme', icon: '↗' },
  { key: 'settings', label: 'Ayarlar', icon: '⚙' },
  { key: 'about', label: 'Hakkında', icon: 'i' },
];

export function BottomTabs({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <View style={styles.shell}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              hitSlop={4}
              style={({ pressed }) => [styles.item, isActive && styles.activeItem, pressed && styles.pressed]}
            >
              <Text style={[styles.icon, isActive && styles.activeLabel]}>{tab.icon}</Text>
              <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, borderTopWidth: 1,
    borderTopColor: colors.border, backgroundColor: colors.overlay,
  },
  container: { flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: colors.surface },
  item: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  activeItem: { backgroundColor: colors.surfaceRaised },
  pressed: { opacity: 0.72 },
  icon: { color: colors.muted, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  label: { color: colors.muted, fontWeight: '600', fontSize: 11, marginTop: 3 },
  activeLabel: { color: colors.accent },
});
