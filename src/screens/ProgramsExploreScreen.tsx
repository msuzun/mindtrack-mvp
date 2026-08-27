import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProgramManagerService } from '../services/ProgramManagerService';
import { ProgramDefinition, ProgramLevel } from '../types';
import { radii, spacing, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { addDays, toLocalDateKey } from '../utils/date';

const levels: Record<ProgramLevel, string> = { beginner: 'Başlangıç', intermediate: 'Orta', advanced: 'İleri' };
const icons = { memory: '◈', focus: '◎', logic: '◇', mindfulness: '◌' } as const;
function nextMonday() { const today = toLocalDateKey(); const day = new Date(`${today}T12:00:00`).getDay(); return addDays(today, day === 1 ? 7 : (8 - day) % 7); }

export function ProgramsExploreScreen({ onEnrolled }: { onEnrolled: () => Promise<void> | void }) {
  const styles = useThemedStyles(createStyles); const [programs, setPrograms] = useState<ProgramDefinition[]>([]); const [selected, setSelected] = useState<ProgramDefinition | null>(null);
  useEffect(() => { void ProgramManagerService.getCatalog().then(setPrograms); }, []);
  return <View><Text style={styles.intro}>Hazır müfredatlardan birini seç; her gün ne çalışacağını MindTrack planlasın.</Text>
    {programs.map((program) => <Pressable key={program.id} onPress={() => setSelected(program)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.icon}><Text style={styles.iconText}>{icons[program.category]}</Text></View><View style={styles.copy}><Text style={styles.title}>{program.title}</Text><Text style={styles.description} numberOfLines={2}>{program.description}</Text><View style={styles.meta}><Text style={styles.pill}>{program.durationWeeks} Hafta</Text><Text style={styles.pill}>{levels[program.level]}</Text></View></View><Text style={styles.arrow}>›</Text>
    </Pressable>)}
    <ProgramDetailScreen program={selected} onClose={() => setSelected(null)} onEnrolled={async () => { setSelected(null); await onEnrolled(); }} />
  </View>;
}

export function ProgramDetailScreen({ program, onClose, onEnrolled }: { program: ProgramDefinition | null; onClose: () => void; onEnrolled: () => Promise<void> }) {
  const styles = useThemedStyles(createStyles); const [expanded, setExpanded] = useState(1); const [starting, setStarting] = useState(false);
  const start = async (date: string) => { if (!program || starting) return; setStarting(true); try { await ProgramManagerService.enroll(program.id, date); await onEnrolled(); } catch (error) { Alert.alert('Program başlatılamadı', error instanceof Error ? error.message : 'Lütfen tekrar dene.'); } finally { setStarting(false); } };
  return <Modal visible={Boolean(program)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><ScrollView contentContainerStyle={styles.detail}>
    <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable><Text style={styles.detailKicker}>{program ? icons[program.category] : ''} REHBERLİ PROGRAM</Text><Text style={styles.detailTitle}>{program?.title}</Text><Text style={styles.detailDescription}>{program?.description}</Text>
    <View style={styles.detailMeta}><Text style={styles.pill}>{program?.durationWeeks} Hafta</Text><Text style={styles.pill}>{program ? levels[program.level] : ''}</Text></View><Text style={styles.curriculumTitle}>Müfredat</Text>
    {program?.curriculum.map((week) => <View key={week.week} style={styles.weekCard}><Pressable onPress={() => setExpanded(expanded === week.week ? 0 : week.week)} style={styles.weekHeader}><View><Text style={styles.weekNumber}>{week.week}. HAFTA</Text><Text style={styles.weekTitle}>{week.title}</Text></View><Text style={styles.arrow}>{expanded === week.week ? '⌃' : '⌄'}</Text></Pressable>{expanded === week.week && <View><Text style={styles.weekDescription}>{week.description}</Text>{week.routines.map((routine) => <Text key={routine.id} style={styles.routine}>• {routine.title} · {routine.targetMinutes} dk</Text>)}</View>}</View>)}
    <Text style={styles.startLabel}>Başlangıç tarihi</Text><View style={styles.startActions}><Pressable disabled={starting} onPress={() => void start(toLocalDateKey())} style={styles.startButton}><Text style={styles.startButtonText}>Bugün Başla</Text></Pressable><Pressable disabled={starting} onPress={() => void start(nextMonday())} style={styles.altButton}><Text style={styles.altButtonText}>Gelecek Pazartesi</Text></Pressable></View>
  </ScrollView></Modal>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  intro: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 14 }, card: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 10, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, pressed: { opacity: .75 }, icon: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.surfaceRaised }, iconText: { color: colors.accent, fontSize: 24 }, copy: { flex: 1, marginLeft: 12 }, title: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' }, description: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 3 }, meta: { flexDirection: 'row', gap: 6, marginTop: 8 }, pill: { color: colors.accent, fontSize: 9, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised }, arrow: { color: colors.textMuted, fontSize: 22 },
  detail: { paddingHorizontal: spacing.screen, paddingTop: 18, paddingBottom: 40, backgroundColor: colors.background }, close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.surface }, closeText: { color: colors.textPrimary, fontSize: 25 }, detailKicker: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 20 }, detailTitle: { color: colors.textPrimary, fontSize: 28, lineHeight: 36, fontWeight: '700', marginTop: 8 }, detailDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 8 }, detailMeta: { flexDirection: 'row', gap: 7, marginTop: 13 }, curriculumTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 25, marginBottom: 10 },
  weekCard: { padding: 14, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, weekNumber: { color: colors.accent, fontSize: 8, fontWeight: '800', letterSpacing: 1 }, weekTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 3 }, weekDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 10 }, routine: { color: colors.textPrimary, fontSize: 11, marginTop: 7 }, startLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginTop: 20, marginBottom: 9 }, startActions: { flexDirection: 'row', gap: 8 }, startButton: { flex: 1, alignItems: 'center', padding: 13, borderRadius: radii.pill, backgroundColor: colors.accent }, startButtonText: { color: colors.onAccent, fontSize: 11, fontWeight: '800' }, altButton: { flex: 1, alignItems: 'center', padding: 13, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border }, altButtonText: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
});
