import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AreaAnalysisCard, CapacityFocusCard, CognitiveScoreCard, InsightCardSkeleton } from '../components/PerformanceInsightCards';
import { AnalyticsService, AnalyticsTimeRange, CapacityFocusStats, CognitiveAccuracyStats, StrengthWeaknessStats } from '../services/AnalyticsService';
import { calculateProgressInsights } from '../utils/calculateProgressInsights';
import { radii, spacing, ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { ProgressScreen } from './ProgressScreen';

type DetailKind = 'cognitive' | 'capacity' | 'areas';
type DashboardData = { cognitive: CognitiveAccuracyStats; capacity: CapacityFocusStats; areas: StrengthWeaknessStats };
const RANGE_LABELS: Array<{ key: AnalyticsTimeRange; label: string }> = [
  { key: 'weekly', label: 'Haftalık' }, { key: 'monthly', label: 'Aylık' }, { key: 'yearly', label: 'Yıllık' },
];

async function loadDashboard(range: AnalyticsTimeRange): Promise<DashboardData> {
  const [cognitive, capacity, areas] = await Promise.all([
    AnalyticsService.getCognitiveAccuracyTrend(range), AnalyticsService.getCapacityAndFocusStats(range), AnalyticsService.getStrengthsAndWeaknesses(),
  ]);
  return { cognitive, capacity, areas };
}

function DetailModal({ kind, onClose }: { kind: DetailKind | null; onClose: () => void }) {
  const styles = useThemedStyles(createStyles);
  const [range, setRange] = useState<AnalyticsTimeRange>('weekly');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!kind) return;
    let active = true; setLoading(true);
    void loadDashboard(range).then((result) => { if (active) setData(result); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind, range]);
  const title = kind === 'cognitive' ? 'Bilişsel doğruluk' : kind === 'capacity' ? 'Odak ve kapasite' : 'Alan dengesi';
  const maxCapacity = Math.max(1, ...(data?.capacity.capacityTrend.map((point) => point.value) ?? []));
  return <Modal visible={Boolean(kind)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <View style={styles.modalScreen}>
      <View style={styles.modalHeader}><View><Text style={styles.modalEyebrow}>PERFORMANS DETAYI</Text><Text style={styles.modalTitle}>{title}</Text></View><Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
      <View style={styles.segment}>{RANGE_LABELS.map((item) => <Pressable key={item.key} onPress={() => setRange(item.key)} style={[styles.segmentItem, range === item.key && styles.segmentActive]}><Text style={[styles.segmentText, range === item.key && styles.segmentTextActive]}>{item.label}</Text></Pressable>)}</View>
      <ScrollView contentContainerStyle={styles.detailContent}>
        {loading || !data ? <><InsightCardSkeleton /><InsightCardSkeleton /></> : kind === 'cognitive' ? <>
          <View style={styles.detailHero}><Text style={styles.detailNumber}>%{Math.round(data.cognitive.overallAccuracy)}</Text><Text style={styles.detailCaption}>{data.cognitive.sessionCount} ölçümlü oturum · Görev tamamlama oranından bağımsızdır.</Text></View>
          {data.cognitive.points.map((point) => <View key={point.label} style={styles.detailRow}><Text style={styles.detailRowLabel}>{point.label}</Text><View style={styles.detailTrack}><View style={[styles.detailFill, { width: `${point.accuracy}%` as `${number}%` }]} /></View><Text style={styles.detailRowValue}>%{Math.round(point.accuracy)}</Text></View>)}
          <Text style={styles.info}>Hız–doğruluk verimlilik ilişkisi: {data.cognitive.efficiencyIndex == null ? 'Yeterli veri yok' : data.cognitive.efficiencyIndex.toFixed(2)}</Text>
        </> : kind === 'capacity' ? <>
          <View style={styles.detailHero}><Text style={styles.detailNumber}>{data.capacity.averageCorrect} / {data.capacity.averageTotal}</Text><Text style={styles.detailCaption}>Oturum başına ortalama hatırlanan / toplam öğe</Text></View>
          {data.capacity.capacityTrend.map((point) => <View key={point.label} style={styles.detailRow}><Text style={styles.detailRowLabel}>{point.label}</Text><View style={styles.detailTrack}><View style={[styles.capacityFill, { width: `${point.value / maxCapacity * 100}%` as `${number}%` }]} /></View><Text style={styles.detailRowValue}>{point.value}</Text></View>)}
          <Text style={styles.sectionLabel}>ODAK SÜRESİ TRENDİ</Text>
          {data.capacity.focusTrend.map((point) => <View key={`focus-${point.label}`} style={styles.detailRow}><Text style={styles.detailRowLabel}>{point.label}</Text><Text style={styles.focusValue}>{Math.round(point.seconds / 60)} dk</Text></View>)}
        </> : <>
          <AreaAnalysisCard data={data.areas} insight={calculateProgressInsights(data.cognitive, data.areas.strength, data.areas.opportunity)} onDetail={() => undefined} />
          <Text style={styles.info}>Alan analizi doğruluk, hata sayısı ve ortalama çözüm süresini birlikte değerlendirir.</Text>
        </>}
      </ScrollView>
    </View>
  </Modal>;
}

function DisciplineModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const styles = useThemedStyles(createStyles);
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <View style={styles.disciplineScreen}>
      <View style={styles.disciplineHeader}>
        <View><Text style={styles.modalEyebrow}>NİCELİK & DİSİPLİN</Text><Text style={styles.disciplineTitle}>Görev Disiplini</Text></View>
        <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Görev disiplini ekranını kapat"><Text style={styles.closeText}>×</Text></Pressable>
      </View>
      <View style={styles.disciplineBody}><ProgressScreen /></View>
    </View>
  </Modal>;
}

export function PerformanceInsightsScreen() {
  const styles = useThemedStyles(createStyles);
  const [data, setData] = useState<DashboardData | null>(null);
  const [detail, setDetail] = useState<DetailKind | null>(null);
  const [disciplineVisible, setDisciplineVisible] = useState(false);
  const load = useCallback(async () => setData(await loadDashboard('weekly')), []);
  useEffect(() => { void load(); }, [load]);
  const insight = data ? calculateProgressInsights(data.cognitive, data.areas.strength, data.areas.opportunity) : null;
  return <>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageEyebrow}>PERFORMANS & İÇGÖRÜLER</Text><Text style={styles.pageTitle}>Gerçekten gelişiyor muyum?</Text>
      <Text style={styles.pageSubtitle}>Disiplininden ayrı olarak doğruluk, kapasite ve odak kaliteni gör.</Text>
      <Pressable onPress={() => setDisciplineVisible(true)} style={styles.disciplineLink} accessibilityRole="button">
        <View><Text style={styles.disciplineLinkLabel}>GÖREV DİSİPLİNİ</Text><Text style={styles.disciplineLinkText}>Tamamlama grafikleri ve aktivite ritmi</Text></View><Text style={styles.disciplineArrow}>→</Text>
      </Pressable>
      {!data || !insight ? <><InsightCardSkeleton /><InsightCardSkeleton /><InsightCardSkeleton /></> : <>
        <CognitiveScoreCard data={data.cognitive} insight={insight} onDetail={setDetail} />
        <CapacityFocusCard data={data.capacity} onDetail={setDetail} />
        <AreaAnalysisCard data={data.areas} insight={insight} onDetail={setDetail} />
      </>}
      <Text style={styles.privacy}>İçgörüler yalnızca cihazındaki eğitim verilerinden hesaplanır.</Text>
    </ScrollView><DetailModal kind={detail} onClose={() => setDetail(null)} /><DisciplineModal visible={disciplineVisible} onClose={() => setDisciplineVisible(false)} />
  </>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 22, paddingBottom: 38 }, pageEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 }, pageTitle: { color: colors.textPrimary, fontSize: 27, lineHeight: 35, fontWeight: '700', marginTop: 7 }, pageSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 12 }, privacy: { color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 4 },
  disciplineLink: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 16 }, disciplineLinkLabel: { color: colors.success, fontSize: 8, fontWeight: '800', letterSpacing: 1 }, disciplineLinkText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 3 }, disciplineArrow: { color: colors.accent, fontSize: 21 },
  disciplineScreen: { flex: 1, backgroundColor: colors.background }, disciplineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 }, disciplineTitle: { color: colors.textPrimary, fontSize: 23, fontWeight: '700', marginTop: 3 }, disciplineBody: { flex: 1 },
  modalScreen: { flex: 1, backgroundColor: colors.background, paddingTop: 18 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }, modalEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }, modalTitle: { color: colors.textPrimary, fontSize: 23, fontWeight: '700', marginTop: 4 }, close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, closeText: { color: colors.textMuted, fontSize: 25 },
  segment: { flexDirection: 'row', margin: 20, padding: 4, borderRadius: radii.card, backgroundColor: colors.surface }, segmentItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, segmentActive: { backgroundColor: colors.surfaceRaised }, segmentText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' }, segmentTextActive: { color: colors.accent }, detailContent: { paddingHorizontal: 20, paddingBottom: 32 },
  detailHero: { padding: 18, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 18 }, detailNumber: { color: colors.textPrimary, fontSize: 34, fontWeight: '800' }, detailCaption: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 }, detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 }, detailRowLabel: { width: 66, color: colors.textMuted, fontSize: 10 }, detailTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: 'hidden' }, detailFill: { height: '100%', borderRadius: 4, backgroundColor: colors.accent }, capacityFill: { height: '100%', borderRadius: 4, backgroundColor: colors.success }, detailRowValue: { width: 38, color: colors.textPrimary, fontSize: 10, fontWeight: '700', textAlign: 'right' }, sectionLabel: { color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 12, marginBottom: 12 }, focusValue: { flex: 1, color: colors.textPrimary, fontSize: 12, fontWeight: '700' }, info: { color: colors.textMuted, fontSize: 11, lineHeight: 18, padding: 14, borderRadius: 12, backgroundColor: colors.surface },
});
