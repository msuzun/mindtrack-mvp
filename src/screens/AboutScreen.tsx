import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, ThemeColors } from '../theme';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export function AboutScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>MINDTRACK 1.0.0</Text>
      <Text style={styles.title}>Hakkında</Text>
      <Text style={styles.subtitle}>Sade, güvenli ve tamamen sana ait.</Text>

      <View style={styles.card}>
        <View style={styles.iconBadge}><Text style={styles.icon}>M</Text></View>
        <Text style={styles.heading}>Günlük odağın için</Text>
        <Text style={styles.text}>
          MindTrack; günlük hafıza, bilişsel gelişim ve odak/dua çalışmalarını
          cihaz üzerinde takip etmek için hazırlanmış çevrimdışı bir uygulamadır.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>GİZLİLİK</Text>
        <Text style={styles.heading}>Verilerin cihazında kalır</Text>
        <Text style={styles.text}>
          Bu sürüm kullanıcı hesabı oluşturmaz, reklam göstermez ve analiz SDK'sı
          içermez. Görev ve ilerleme kayıtları yalnızca cihazdaki yerel SQLite
          veritabanında tutulur. Uygulama bu verileri kendi sunucusuna göndermez.
        </Text>
        <View style={styles.divider} />
        <Text style={styles.text}>
          Uygulamayı kaldırmanız halinde işletim sistemi yerel uygulama verilerini
          de silebilir. Bu sürümde bulut yedekleme veya hesap senkronizasyonu yoktur.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>BİLGİLENDİRME</Text>
        <Text style={styles.heading}>Tıbbi / Psikolojik iddia</Text>
        <Text style={styles.text}>
          Uygulama bir sağlık hizmeti veya tanı aracı değildir. Bilişsel egzersizler
          belirli bir IQ puanı artışını garanti etmez; amaç düzenli çalışma ve
          kişisel ilerleme takibidir.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 22, paddingBottom: 36 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  title: { marginTop: 7, fontSize: 30, lineHeight: 38, fontWeight: '700', color: colors.textPrimary },
  subtitle: { marginTop: 5, marginBottom: 22, color: colors.textMuted, lineHeight: 21 },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.card, padding: spacing.card, marginBottom: 12,
  },
  iconBadge: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center',
    borderRadius: 13, backgroundColor: colors.accent, marginBottom: 14,
  },
  icon: { color: colors.onAccent, fontSize: 20, fontWeight: '800' },
  cardEyebrow: { color: colors.success, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 7 },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: '700', marginBottom: 8, color: colors.textPrimary },
  text: { color: colors.textMuted, lineHeight: 21, fontSize: 13 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
});
