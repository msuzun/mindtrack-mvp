import { NotificationTone } from '../types';

export type NotificationContext = {
  remainingCount: number;
  totalCount: number;
  remainingMinutes: number;
  weeklyPercent: number;
  streakDays: number;
};

export type NotificationCopy = { title: string; body: string };

const titleByTone: Record<NotificationTone, string> = {
  gentle: 'Kendine küçük bir alan aç', balanced: 'Bugünün en iyi sonraki adımı', energetic: 'Ritmini sürdür!',
};

export const NotificationCopywriter = {
  compose(context: NotificationContext, tone: NotificationTone): NotificationCopy | null {
    if (context.totalCount === 0 || context.remainingCount === 0) return null;
    const completed = context.totalCount - context.remainingCount;
    const percent = Math.round(completed / context.totalCount * 100);
    let fact: string;
    if (context.weeklyPercent >= 90 && context.weeklyPercent < 100) {
      fact = `Bu hafta hedeflerinin %${context.weeklyPercent}'sindesin. Bir küçük adım daha haftayı güçlü kapatabilir.`;
    } else if (percent >= 80) {
      fact = `Günlük hedeflerinin %${percent}'i bitti. Son bir adımla bugünü tamamlayabilirsin.`;
    } else if (context.remainingMinutes > 0 && context.remainingMinutes <= 25) {
      fact = `Bugünkü hedeflerin için yaklaşık ${context.remainingMinutes} dakikalık bir çalışma kaldı.`;
    } else {
      fact = `Bugün tamamlanmayı bekleyen ${context.remainingCount} görevin var.`;
    }
    const streak = context.streakDays >= 2 ? ` Son ${context.streakDays} gündür kurduğun ritim yanında.` : '';
    if (tone === 'gentle') return { title: titleByTone[tone], body: `${fact} Hazır olduğunda kısa bir odaklanma deneyebilirsin.${streak}` };
    if (tone === 'energetic') return { title: titleByTone[tone], body: `${fact} Şimdi kısa bir odak seansıyla ilerle!${streak}` };
    return { title: titleByTone[tone], body: `${fact} 15 dakikalık bir odaklanma ile başlayabilirsin.${streak}` };
  },

  interrupted(taskTitle: string, tone: NotificationTone): NotificationCopy {
    const body = tone === 'energetic'
      ? `Yarım kalan “${taskTitle}” seansına dönüp ritmini tamamlamaya ne dersin?`
      : tone === 'gentle'
        ? `“${taskTitle}” seansın seni bekliyor. Uygun olduğunda kaldığın yerden nazikçe devam edebilirsin.`
        : `Yarım bıraktığın “${taskTitle}” seansını tamamlamak ister misin?`;
    return { title: 'Kaldığın yerden devam et', body };
  },
};
