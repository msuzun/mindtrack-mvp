import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { RecordTrackerService } from '../services/RecordTrackerService';
import { PersonalRecord } from '../types';
import { ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';

const labels = { max_items: 'Yeni hatırlama rekoru', peak_accuracy: 'Yeni doğruluk rekoru', longest_focus: 'Yeni odak rekoru', best_streak_week: 'Yeni disiplin rekoru' } as const;
export function PersonalRecordCelebration() {
  const styles = useThemedStyles(createStyles); const [record, setRecord] = useState<PersonalRecord | null>(null); const opacity = useRef(new Animated.Value(0)).current; const scale = useRef(new Animated.Value(.92)).current;
  useEffect(() => RecordTrackerService.subscribe((next) => { setRecord(next); opacity.setValue(0); scale.setValue(.92); Animated.sequence([Animated.parallel([Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, useNativeDriver: true })]), Animated.delay(1800), Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true })]).start(() => setRecord(null)); }), [opacity, scale]);
  if (!record) return null;
  return <View pointerEvents="none" style={styles.layer}><Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}><Text style={styles.sparkle}>✦</Text><Text style={styles.eyebrow}>KİŞİSEL REKOR</Text><Text style={styles.title}>{labels[record.recordType]}</Text><Text style={styles.value}>{record.value}{record.recordType.includes('accuracy') || record.recordType === 'best_streak_week' ? '%' : record.recordType === 'longest_focus' ? ' dk' : ' öğe'}</Text></Animated.View></View>;
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({ layer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 500, justifyContent: 'center', padding: 36, backgroundColor: 'rgba(15,23,42,.28)' }, card: { alignItems: 'center', padding: 24, borderRadius: 22, borderWidth: 1, borderColor: colors.warning, backgroundColor: colors.surface, shadowColor: '#fbbf24', shadowOpacity: .35, shadowRadius: 18, elevation: 12 }, sparkle: { color: colors.warning, fontSize: 34 }, eyebrow: { color: colors.warning, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 5 }, title: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 8 }, value: { color: colors.accent, fontSize: 28, fontWeight: '900', marginTop: 6 } });
