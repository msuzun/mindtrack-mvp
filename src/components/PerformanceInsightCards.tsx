import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { CapacityFocusStats, CognitiveAccuracyStats, StrengthWeaknessStats } from '../services/AnalyticsService';
import { ProgressInsights } from '../utils/calculateProgressInsights';
import { radii, spacing, ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

type DetailKind = 'cognitive' | 'capacity' | 'areas';
const detailLabel = 'Detayları Gör →';

function CardHeader({ eyebrow, onDetail }: { eyebrow: string; onDetail: () => void }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.header}><Text style={styles.eyebrow}>{eyebrow}</Text><Pressable onPress={onDetail} hitSlop={8}><Text style={styles.detail}>{detailLabel}</Text></Pressable></View>;
}

function Sparkline({ values }: { values: number[] }) {
  const { colors } = useTheme();
  if (values.length === 0) return <View style={createStyles(colors).emptyChart}><Text style={createStyles(colors).emptyChartText}>İlk ölçüm bekleniyor</Text></View>;
  const width = 280; const height = 68; const min = Math.min(...values); const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : index / (values.length - 1) * width;
    const y = height - 8 - ((value - min) / Math.max(1, max - min)) * (height - 16);
    return `${x},${y}`;
  }).join(' ');
  return <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Polyline points={points} fill="none" stroke={colors.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600); const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}s ${minutes}dk` : `${minutes} dk`;
}

export function CognitiveScoreCard({ data, insight, onDetail }: { data: CognitiveAccuracyStats; insight: ProgressInsights; onDetail: (kind: DetailKind) => void }) {
  const styles = useThemedStyles(createStyles);
  const positive = insight.delta >= 0;
  return <View style={styles.card}>
    <CardHeader eyebrow="BİLİŞSEL GELİŞİM" onDetail={() => onDetail('cognitive')} />
    <View style={styles.scoreRow}><Text style={styles.score}>%{Math.round(data.overallAccuracy)}</Text><View style={[styles.deltaBadge, !positive && styles.warningBadge]}><Text style={[styles.deltaText, !positive && styles.warningText]}>{positive ? '▲' : '▼'} {insight.delta > 0 ? '+' : ''}%{insight.delta}</Text></View></View>
    <Text style={styles.insight}>{insight.progressText}</Text>
    <Sparkline values={data.points.map((point) => point.accuracy)} />
  </View>;
}

export function CapacityFocusCard({ data, onDetail }: { data: CapacityFocusStats; onDetail: (kind: DetailKind) => void }) {
  const styles = useThemedStyles(createStyles);
  const first = data.capacityTrend[0]?.value ?? 0; const last = data.capacityTrend[data.capacityTrend.length - 1]?.value ?? 0;
  const growth = first > 0 ? Math.max(0, Math.min(100, last / first * 50)) : 0;
  return <View style={styles.card}>
    <CardHeader eyebrow="ODAK & KAPASİTE" onDetail={() => onDetail('capacity')} />
    <View style={styles.metricRow}><View style={styles.metric}><Text style={styles.metricValue}>{data.averageCorrect} <Text style={styles.metricMuted}>/ {data.averageTotal}</Text></Text><Text style={styles.metricLabel}>ORT. HATIRLANAN ÖĞE</Text></View><View style={styles.divider} /><View style={styles.metric}><Text style={styles.metricValue}>{formatDuration(data.weeklyFocusSeconds)}</Text><Text style={styles.metricLabel}>HAFTALIK DERİN ODAK</Text></View></View>
    <Text style={styles.barLabel}>Öğe kapasitesi eğilimi</Text><View style={styles.track}><View style={[styles.fill, { width: `${growth}%` as `${number}%` }]} /></View>
  </View>;
}

export function AreaAnalysisCard({ data, insight, onDetail }: { data: StrengthWeaknessStats; insight: ProgressInsights; onDetail: (kind: DetailKind) => void }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.card}>
    <CardHeader eyebrow="ALAN ANALİZİ & DENGE" onDetail={() => onDetail('areas')} />
    <View style={styles.area}><Text style={styles.areaIcon}>★</Text><View style={styles.areaCopy}><Text style={styles.areaLabel}>EN GÜÇLÜ ALAN</Text><Text style={styles.areaValue}>{insight.strengthText}</Text></View></View>
    <View style={styles.area}><Text style={[styles.areaIcon, styles.targetIcon]}>◎</Text><View style={styles.areaCopy}><Text style={[styles.areaLabel, styles.warningText]}>GELİŞTİRİLEBİLİR ALAN</Text><Text style={styles.areaValue}>{insight.opportunityText}</Text></View></View>
    <View style={styles.recommendation}><Text style={styles.recommendationText}>{insight.recommendation}</Text></View>
  </View>;
}

export function InsightCardSkeleton() {
  const styles = useThemedStyles(createStyles);
  const opacity = useRef(new Animated.Value(.45)).current;
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: .45, duration: 650, useNativeDriver: true }),
    ]));
    pulse.start(); return () => pulse.stop();
  }, [opacity]);
  return <Animated.View style={[styles.card, { opacity }]}><View style={[styles.skeleton, { width: '42%' }]} /><View style={[styles.skeleton, styles.skeletonHero]} /><View style={[styles.skeleton, { width: '78%' }]} /></Animated.View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: spacing.card, marginBottom: 14, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }, detail: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 }, score: { color: colors.textPrimary, fontSize: 44, lineHeight: 52, fontWeight: '800', fontVariant: ['tabular-nums'] },
  deltaBadge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.illustrationGlowSecondary }, deltaText: { color: colors.success, fontSize: 11, fontWeight: '800' }, warningBadge: { backgroundColor: colors.tagRoutineBg }, warningText: { color: colors.warning },
  insight: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3, marginBottom: 5 },
  emptyChart: { height: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.background, marginTop: 8 }, emptyChartText: { color: colors.textMuted, fontSize: 11 },
  metricRow: { flexDirection: 'row', marginTop: 19, alignItems: 'stretch' }, metric: { flex: 1 }, divider: { width: 1, backgroundColor: colors.border, marginHorizontal: 14 },
  metricValue: { color: colors.textPrimary, fontSize: 20, lineHeight: 28, fontWeight: '800', fontVariant: ['tabular-nums'] }, metricMuted: { color: colors.textMuted, fontSize: 14 }, metricLabel: { color: colors.textMuted, fontSize: 8, lineHeight: 12, fontWeight: '800', letterSpacing: .7, marginTop: 3 },
  barLabel: { color: colors.textMuted, fontSize: 11, marginTop: 19, marginBottom: 7 }, track: { height: 8, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 4, backgroundColor: colors.success },
  area: { flexDirection: 'row', alignItems: 'center', marginTop: 17 }, areaIcon: { width: 32, color: colors.success, fontSize: 21 }, targetIcon: { color: colors.warning }, areaCopy: { flex: 1 }, areaLabel: { color: colors.success, fontSize: 8, fontWeight: '800', letterSpacing: .9 }, areaValue: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 3 },
  recommendation: { backgroundColor: colors.background, borderRadius: 12, padding: 12, marginTop: 17 }, recommendationText: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  skeleton: { height: 12, borderRadius: 6, backgroundColor: colors.surfaceRaised }, skeletonHero: { width: '55%', height: 44, marginTop: 20, marginBottom: 14 },
});
