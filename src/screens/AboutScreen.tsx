import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Hakkında & Gizlilik</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>MindTrack 1.0.0</Text>
        <Text style={styles.text}>
          MindTrack; günlük hafıza, bilişsel gelişim ve odak/dua çalışmalarını
          cihaz üzerinde takip etmek için hazırlanmış çevrimdışı bir uygulamadır.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Gizlilik</Text>
        <Text style={styles.text}>
          Bu sürüm kullanıcı hesabı oluşturmaz, reklam göstermez ve analiz SDK'sı
          içermez. Görev ve ilerleme kayıtları yalnızca cihazdaki yerel SQLite
          veritabanında tutulur. Uygulama bu verileri kendi sunucusuna göndermez.
        </Text>
        <Text style={styles.text}>
          Uygulamayı kaldırmanız halinde işletim sistemi yerel uygulama verilerini
          de silebilir. Bu sürümde bulut yedekleme veya hesap senkronizasyonu yoktur.
        </Text>
      </View>

      <View style={styles.card}>
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

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: '900', color: '#171a21', marginBottom: 18 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6e8ec',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  heading: { fontSize: 17, fontWeight: '900', marginBottom: 8, color: '#171a21' },
  text: { color: '#606672', lineHeight: 21, marginBottom: 8 },
});
