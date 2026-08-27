import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { getReminderSettings, ReminderSettings } from '../db/database';
import { NotificationService } from '../services/NotificationService';
import { colors, radii, spacing } from '../theme';

const twoDigits = (value: number) => String(value).padStart(2, '0');

export function SettingsScreen() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [draftHour, setDraftHour] = useState(9);
  const [draftMinute, setDraftMinute] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const saved = await getReminderSettings();
      const permission = await NotificationService.getPermissionStatus();
      setSettings(saved);
      setPermissionDenied(saved.enabled && !permission.granted);
      setCanAskAgain(permission.canAskAgain);
    })();
  }, []);

  async function toggleReminder(enabled: boolean) {
    if (!settings || saving) return;
    setSaving(true);
    try {
      if (enabled) {
        const permission = await NotificationService.requestPermission();
        setCanAskAgain(permission.canAskAgain);
        if (!permission.granted) {
          setPermissionDenied(true);
          return;
        }
      }
      const next = { ...settings, enabled };
      await NotificationService.updateSettings(next);
      setSettings(next);
      setPermissionDenied(false);
    } finally {
      setSaving(false);
    }
  }

  function openPicker() {
    if (!settings) return;
    setDraftHour(settings.hour);
    setDraftMinute(settings.minute);
    setPickerVisible(true);
  }

  async function saveTime() {
    if (!settings) return;
    setSaving(true);
    try {
      const next = { ...settings, hour: draftHour, minute: draftMinute };
      await NotificationService.updateSettings(next);
      setSettings(next);
      setPickerVisible(false);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <ActivityIndicator style={styles.loader} color={colors.accent} />;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>AYARLAR</Text>
      <Text style={styles.title}>Günlük Hatırlatıcılar</Text>
      <Text style={styles.subtitle}>Hatırlatmalar yalnızca bu cihazda planlanır. Hiçbir veri gönderilmez.</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Günlük Hatırlatıcılar</Text>
            <Text style={styles.help}>Her gün belirlediğin saatte odağını tazele.</Text>
          </View>
          <Switch value={settings.enabled} onValueChange={(value) => void toggleReminder(value)} disabled={saving}
            trackColor={{ false: colors.border, true: colors.accent }} thumbColor={colors.text}
            accessibilityLabel="Günlük hatırlatıcıları aç veya kapat" />
        </View>
        <View style={styles.divider} />
        <Pressable onPress={openPicker} disabled={saving} accessibilityRole="button"
          style={({ pressed }) => [styles.timeRow, pressed && styles.pressed]}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Hatırlatma Saati</Text>
            <Text style={styles.help}>Cihazının yerel saat dilimi kullanılır.</Text>
          </View>
          <Text style={styles.time}>{twoDigits(settings.hour)}:{twoDigits(settings.minute)}</Text>
        </Pressable>
      </View>

      {permissionDenied && (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Bildirim izni kapalı</Text>
          <Text style={styles.noticeText}>Hatırlatıcıları kullanmak istersen bildirim iznini sistem ayarlarından açabilirsin.</Text>
          {!canAskAgain && <Pressable onPress={() => void NotificationService.openSystemSettings()} style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>Sistem ayarlarını aç</Text>
          </Pressable>}
        </View>
      )}

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Hatırlatma Saati</Text>
          <View style={styles.pickerRow}>
            <NumberPicker label="Saat" value={draftHour} max={23} onChange={setDraftHour} />
            <Text style={styles.colon}>:</Text>
            <NumberPicker label="Dakika" value={draftMinute} max={59} step={5} onChange={setDraftMinute} />
          </View>
          <View style={styles.actions}>
            <Pressable onPress={() => setPickerVisible(false)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Vazgeç</Text></Pressable>
            <Pressable onPress={() => void saveTime()} style={styles.primaryButton}><Text style={styles.primaryText}>Kaydet</Text></Pressable>
          </View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

function NumberPicker({ label, value, max, step = 1, onChange }: {
  label: string; value: number; max: number; step?: number; onChange: (value: number) => void;
}) {
  const change = (direction: number) => {
    const next = value + direction * step;
    onChange(next < 0 ? max : next > max ? 0 : next);
  };
  return <View style={styles.numberPicker}>
    <Text style={styles.pickerLabel}>{label}</Text>
    <Pressable onPress={() => change(1)} style={styles.pickerButton}><Text style={styles.pickerButtonText}>＋</Text></Pressable>
    <Text style={styles.pickerValue}>{twoDigits(value)}</Text>
    <Pressable onPress={() => change(-1)} style={styles.pickerButton}><Text style={styles.pickerButtonText}>−</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  loader: { marginTop: 60 }, content: { paddingHorizontal: spacing.screen, paddingTop: 26, paddingBottom: 40 },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 29, fontWeight: '700', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 24 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.card, padding: spacing.card },
  row: { flexDirection: 'row', alignItems: 'center' }, rowText: { flex: 1, paddingRight: 14 },
  label: { color: colors.text, fontSize: 16, fontWeight: '700' }, help: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { color: colors.accent, fontSize: 24, fontWeight: '700', marginLeft: 12 }, pressed: { opacity: 0.7 },
  notice: { marginTop: 16, padding: 16, borderRadius: radii.card, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  noticeTitle: { color: colors.text, fontSize: 14, fontWeight: '700' }, noticeText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  settingsButton: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: colors.accent, borderRadius: 10 },
  settingsButtonText: { color: colors.background, fontWeight: '700', fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(2, 6, 23, 0.82)' },
  modalCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 22 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 24 }, numberPicker: { alignItems: 'center' },
  pickerLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  pickerButton: { width: 48, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised, borderRadius: 10 },
  pickerButtonText: { color: colors.accent, fontSize: 22, lineHeight: 25 },
  pickerValue: { color: colors.text, fontSize: 36, fontWeight: '700', marginVertical: 10, minWidth: 64, textAlign: 'center' },
  colon: { color: colors.muted, fontSize: 30, marginHorizontal: 8, marginTop: 20 }, actions: { flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, alignItems: 'center', padding: 13, borderRadius: 11, borderWidth: 1, borderColor: colors.border }, secondaryText: { color: colors.muted, fontWeight: '700' },
  primaryButton: { flex: 1, alignItems: 'center', padding: 13, borderRadius: 11, backgroundColor: colors.accent }, primaryText: { color: colors.background, fontWeight: '700' },
});
