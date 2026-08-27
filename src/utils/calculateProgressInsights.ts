import { AreaMetric, CognitiveAccuracyStats } from '../services/AnalyticsService';

export type ProgressInsights = {
  delta: number;
  progressText: string;
  strengthText: string;
  opportunityText: string;
  recommendation: string;
};

const percent = (value: number) => `%${Math.round(value)}`;

export function calculateProgressInsights(
  cognitive: CognitiveAccuracyStats,
  strength: AreaMetric | null,
  opportunity: AreaMetric | null,
): ProgressInsights {
  const first = cognitive.points[0]?.accuracy ?? cognitive.overallAccuracy;
  const last = cognitive.points.at(-1)?.accuracy ?? cognitive.overallAccuracy;
  const delta = Math.round((last - first) * 10) / 10;
  const progressText = cognitive.sessionCount === 0
    ? 'İlk ölçümlü antrenmanın, gelişim çizginin başlangıç noktası olacak.'
    : cognitive.points.length < 2
      ? `Mevcut bilişsel doğruluk seviyen ${percent(cognitive.overallAccuracy)}.`
      : `Son dönemde bilişsel doğruluğun ${percent(first)} → ${percent(last)} ${delta >= 0 ? 'yükseldi' : 'değişti'}.`;
  const strengthText = strength ? `${strength.label} (${percent(strength.accuracy)} doğruluk)` : 'Henüz yeterli ölçüm yok';
  const opportunityText = opportunity ? `${opportunity.label} (${percent(opportunity.accuracy)} doğruluk)` : 'İlk antrenmanını kaydet';
  const recommendation = opportunity
    ? `${opportunity.label} için kısa ve düzenli bir tekrar, doğruluk-hız dengesini güçlendirebilir.`
    : 'Bir hafıza veya mantık oturumu tamamlayarak kişisel önerilerini oluştur.';
  return { delta, progressText, strengthText, opportunityText, recommendation };
}
