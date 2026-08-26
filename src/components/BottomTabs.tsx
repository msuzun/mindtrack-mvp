import { Pressable, StyleSheet, Text, View } from 'react-native';

export type Tab = 'today' | 'plan' | 'progress' | 'about';

const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'today', label: 'Bugün' },
  { key: 'plan', label: 'Plan' },
  { key: 'progress', label: 'İlerleme' },
  { key: 'about', label: 'Hakkında' },
];

export function BottomTabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.item}>
          <Text style={[styles.label, active === tab.key && styles.active]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e6e8ec',
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  item: { flex: 1, alignItems: 'center' },
  label: { color: '#858b96', fontWeight: '700', fontSize: 12 },
  active: { color: '#11141a' },
});
