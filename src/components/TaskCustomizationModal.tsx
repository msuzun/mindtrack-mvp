import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { updateTaskCustomization } from '../db/database';
import { radii, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { CategoryTag, PriorityLevel, Task } from '../types';
import { TaskCustomizationFields } from './TaskCustomizationFields';

export function TaskCustomizationModal({ task, onClose, onSaved }: {
  task: Task;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const styles = useThemedStyles(createStyles);
  const [categoryTag, setCategoryTag] = useState<CategoryTag | null>(task.categoryTag);
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>(task.priorityLevel);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateTaskCustomization(task.id, categoryTag, priorityLevel);
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return <Modal transparent animationType="fade" visible onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>KARTI ÖZELLEŞTİR</Text>
        <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
        <TaskCustomizationFields categoryTag={categoryTag} priorityLevel={priorityLevel}
          onCategoryChange={setCategoryTag} onPriorityChange={setPriorityLevel} />
        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.secondary}><Text style={styles.secondaryText}>Vazgeç</Text></Pressable>
          <Pressable onPress={() => void save()} disabled={saving} style={styles.primary}><Text style={styles.primaryText}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Text></Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: colors.modalOverlay },
  card: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  eyebrow: { color: colors.accent, fontSize: 10, lineHeight: 15, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.textPrimary, fontSize: 18, lineHeight: 27, fontWeight: '600', marginTop: 7, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  secondary: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.textMuted, fontSize: 13, lineHeight: 19.5, fontWeight: '600' },
  primary: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.accent },
  primaryText: { color: colors.onAccent, fontSize: 13, lineHeight: 19.5, fontWeight: '600' },
});
