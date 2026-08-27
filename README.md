# MindTrack v2.2.0

MindTrack; hafıza, bilişsel gelişim, günlük görev ve odaklanma rutinlerini takip etmek için geliştirilmiş, tamamen cihaz üzerinde çalışan offline-first bir React Native / Expo uygulamasıdır.

## v2.2.0 — Training Sessions

- Hafıza, bilişsel, dinginlik ve serbest odak oturumlarını yerel SQLite üzerinde kaydeden eğitim seansı altyapısı eklendi.
- Süre, doğru/yanlış, doğruluk, odak kalitesi ve kısa not girişi sunan kompakt bottom sheet oluşturuldu.
- Performans girişi opsiyonel tutuldu; “Sadece Tamamla” ile görev tek dokunuşla bitirilebiliyor.
- Zen sayacının ölçtüğü süre otomatik aktarılıyor ve sayaç bittiğinde sheet açılıyor.
- Tüm hesaplama ve kayıt işlemleri çevrimdışı, cihaz içinde gerçekleştiriliyor.

## v2.1.0 — Goals & Routines Foundation

- Eski görev listesi modeli hedef, rutin ve günlük görev örneği ilişkisine taşındı.
- v1.x görevlerini kayıpsız aktaran ve eski tabloyu arşivleyen SQLite migration eklendi.
- Aktif rutinlerden yalnızca gerekli günlerde görev üreten günlük materializer kuruldu.
- Hedef ilerlemesini bağlı görevlerden hesaplayan yerel aggregation sorguları eklendi.
- Günlük ekranın sadeliği korunurken Hedefler sekmesi ve hedef+rutin oluşturma akışı eklendi.

## v1.x serisi değişiklik özeti

### Temel uygulama ve veri katmanı

- Günlük görev planı, görev tamamlama ve ilerleme takibi eklendi.
- Görevler, uygulama ayarları ve kullanıcı tercihleri yerel SQLite veritabanında saklandı.
- Zustand tabanlı hafif uygulama durumu ve tarih bazlı görev yükleme akışı kuruldu.
- Kullanıcı veya analitik verilerinin dış sunuculara gönderilmediği sıfır veri toplama yaklaşımı korundu.

### Yerel bildirimler

- FCM ve OneSignal kullanmadan tamamen cihaz üzerinde çalışan günlük hatırlatıcılar eklendi.
- iOS ve Android 13+ bildirim izin yönetimi kuruldu.
- Hatırlatıcı açma/kapatma ve saat seçimi Ayarlar ekranına eklendi.
- Bildirime dokunulduğunda ana görev ekranına yönlendirme sağlandı.
- Tamamlanmamış görev sayısına göre dinamik hatırlatma metinleri oluşturuldu.

### Dinamik tema

- Sistem, Koyu ve Açık olmak üzere üç tema modu eklendi.
- Tema tercihi SQLite üzerinde kalıcı hale getirildi.
- Sistem tema değişiklikleri anlık olarak takip edildi.
- Status bar, kartlar, grafikler, illüstrasyonlar ve kontroller tema token’larına bağlandı.

### Mikro animasyonlar ve haptic feedback

- Görev tamamlamada checkbox yaylanması ve animasyonlu üst çizgi eklendi.
- Hafif, native-driver tabanlı sparkle/konfeti efekti oluşturuldu.
- Tamamlama, silme ve yeniden sıralama için platform uyumlu haptic servisi kuruldu.
- Haptic geri bildirim Ayarlar ekranından kapatılabilir hale getirildi.

### Analitik ve ilerleme ekranı

- Günlük dairesel ilerleme halkası eklendi.
- Son günlerin tamamlanan görevlerini gösteren aktivite ısı haritası oluşturuldu.
- Pazartesi–Pazar aralığını gösteren haftalık çubuk grafik eklendi.
- İstatistikler tüm tabloyu belleğe almayan SQLite aggregation sorgularına bağlandı.
- Grafikler `react-native-svg` ile hafif ve tamamen offline çalışacak şekilde çizildi.

### Boş durum ve illüstrasyon sistemi

- Görev yok, tüm görevler tamamlandı ve sonuç bulunamadı senaryoları için saf SVG illüstrasyonlar eklendi.
- Tema uyumlu, tekrar kullanılabilir `EmptyStateView` bileşeni oluşturuldu.
- İllüstrasyonlara erişilebilirlik ayarına duyarlı yumuşak yüzme animasyonu eklendi.

### Zen odaklanma modu

- Seçilen tek göreve odaklanan tam ekran Zen görünümü eklendi.
- 15, 25 ve 45 dakikalık geri sayım ile serbest kronometre desteği sağlandı.
- Nefes ritimli SVG Zen halkası ve minimal kontrol alanı oluşturuldu.
- Odak modu sırasında ekranın kapanmasını önleyen `expo-keep-awake` entegrasyonu eklendi.
- Tamamlanan odak süreleri yerel `focus_sessions` tablosuna kaydedildi.
- Yanlışlıkla çıkışı engelleyen onay akışı ve başarı titreşimi eklendi.

### Tipografi ve görev kartı özelleştirme

- Küçük, Orta ve Büyük olmak üzere üç yazı ölçeği eklendi.
- Yazı tercihi SQLite üzerinde saklandı ve tema stillerine merkezi olarak uygulandı.
- Görevlere Odaklanma, Kişisel, İş/Proje ve Rutin pastel etiketleri eklendi.
- Normal, Önemli ve Acil öncelik seviyeleri ile renkli öncelik çizgileri oluşturuldu.
- Mevcut verileri koruyan `category_tag` ve `priority_level` SQLite migration’ı eklendi.
- Görev kartlarından açılan kategori ve öncelik özelleştirme modalı oluşturuldu.
- Tamamlanan kartların opaklığı yumuşak animasyonla düşürüldü.

### Uygulama ikonu ve splash screen

- Zen Blue ana ikon ile Midnight, Pure Light ve Solar Sunset alternatif ikonları üretildi.
- Android adaptive icon ve dört `activity-alias` tabanlı dinamik ikon sistemi kuruldu.
- iOS için AppIcon asset-catalog eklentisi ve `setAlternateIconName` yerel köprüsü eklendi.
- İkon seçimi Ayarlar ekranına bağlandı ve SQLite üzerinde saklandı.
- Açık/koyu sistem temasına uyumlu native splash arka planları oluşturuldu.
- SQLite ve tema yüklenene kadar native splash’in görünmesini sağlayan kontrollü açılış akışı eklendi.
- Açılışta 360 ms süren native-driver tabanlı logo scale, glow ve fade geçişi oluşturuldu.

## Teknoloji yığını

- Expo SDK 57
- React Native 0.86
- React 19.2
- TypeScript
- Zustand
- Expo SQLite
- React Native SVG
- Expo Notifications
- Expo Haptics
- Expo Keep Awake
- Expo Splash Screen

## Yerel geliştirme

```bash
npm install
npx expo install --fix
npx expo-doctor
npx expo start --dev-client
```

Native bildirim, haptic, keep-awake ve alternatif ikon modülleri nedeniyle uygulama Expo Go yerine development build ile çalıştırılmalıdır.

```bash
npm run android
npm run ios
```

## Üretim derlemeleri

Mağaza kontrolleri için `STORE_RELEASE_CHECKLIST.md` dosyasına bakın.

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

Uygulama kimlikleri:

- Android: `com.sevkiuzun.mindtrack`
- iOS: `com.sevkiuzun.mindtrack`

Gizlilik ve destek bağlantıları `app.json` içinde tanımlıdır.
