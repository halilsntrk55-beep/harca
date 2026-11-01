# Harcamalarım v2 kurulumu

Statik dosyalar ve `api/analyze.js` mevcut Vercel uygulamasında birlikte yayımlanır; derleme gerekmiyor.

## Giriş ve veri erişimi

1. Araçlar > JSON tam yedek ile eski kayıtları indirin.
2. Firebase Authentication'da E-posta/Şifre ve/veya Google sağlayıcısını etkinleştirin. Site alan adını Authorized Domains'e ekleyin.
3. Siteye giriş yapıp JSON yedeğini içe aktarın. Kişisel kayıtlar `users/{uid}/harcamalarim`, `users/{uid}/harcamalarim_budget` ve `users/{uid}/harcamalarim_features_v2` yollarındadır.
4. Kişisel kayıtları doğruladıktan sonra `database.rules.json` içeriğini Firebase Realtime Database Rules'a yayımlayın. Bu kurallar eski ortak alanı kapatır. Önce yedek ve giriş kurulumu yapılmalı.

Kurallar repoda hazırlanmıştır; Firebase Console'a otomatik uygulanmış değildir. Giriş ekranı tek başına veritabanını korumaz. Kurallar değiştirilene kadar eski ortak alan çalışır.

## Yapay zeka ve fiyatlar

Sunucuda `ANTHROPIC_API_KEY` gerekir. İsteğe bağlı `ANTHROPIC_MODEL` desteklenir. Anahtar tarayıcıya gönderilmez. Anahtar yoksa yerel tarih/tutar/kategori çözümleme çalışır; fotoğraf ve AI analizi kurulum ister. Okunan harcamalar kullanıcı onayından sonra kaydedilir.

Döviz: https://frankfurter.dev/javascript/ . Altın: https://gold-api.com/docs . Gram TL = XAU USD/ons × USD/TRY / 31,1034768; kuyumcu makası dahil değildir. Hisse: Yahoo Finance chart uç noktası; erişilemez veya gecikmeli olabilir. Hata durumunda son kayıtlı fiyat korunur. Üretim için lisanslı piyasa verisi sağlayıcısı kullanılabilir. Excel: SheetJS CE 0.20.3 resmi CDN.

## Çevrimdışı, abonelikler ve bildirimler

PWA HTTPS gerektirir. İlk açılış internet ister. Uygulama kabuğu ve daha önce yüklenen kütüphaneler önbelleklenir. Bekleyen değişiklikler cihazda saklanır ve bağlantı gelince eşitlenir. Aynı kaydı iki cihaz düzenlerse son eşitlenen sürüm geçerlidir.

Düzenli giderler uygulama açıldığında vadesi gelen aylar için sabit kimliklerle eklenir; tekrar oluşturulmaz. Silinen otomatik kayıtlar istisna tutulur. Hatırlatıcı uygulama açıkken ve bildirim izni varsa çalışır. Kapalı uygulamaya zamanlı bildirim için Web Push/VAPID sunucusu, abonelik kaydı ve zamanlanmış iş ayrıca kurulmalıdır; service worker gelen push olayını göstermeye hazırdır.

## Hesaplama

Alışveriş gider, kart borcu ödemesi transferdir. Taksit toplamı ilk anda kart limitini kullanır; bütçeye aylık taksitler girer. Eski dönem açılış kart borcu otomatik günlük gider değildir; borç devri için önceki ay bütçesini girin. Aynı ödemeyi sabit gider ve abonelik olarak iki kez tanımlamayın. Birikimler varlık değeridir, gider değildir. JSON tüm ayrıntıları korur; CSV/Excel harcama tablosu alışverişi içindir.

## Uygulama kapalıyken bildirim kurulumu

Web Push abonelik ekranı ve gönderici uç noktası da hazırdır. Sunucu ortamına `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_DATABASE_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` ve güçlü bir `CRON_SECRET` tanımlayın. VAPID anahtar çifti `npx web-push generate-vapid-keys` ile üretilebilir. Servis hesabı ve özel anahtarları repoya koymayın.

Siteye giriş yapın, Araçlar > Ayarlar > Kapalı uygulama bildirimini kur seçeneğini kullanın. Abonelikler yalnızca sunucunun eriştiği `pushSubscriptions` alanında tutulur. `database.rules.json` bu alanı istemcilerden kapalı tutar.

GitHub Actions için repository secrets: `REMINDER_URL` (sitenin HTTPS kökü) ve sunucudakiyle aynı `CRON_SECRET`; repository variable `REMINDERS_ENABLED=true`. Hazır workflow her 15 dakikada `/api/remind` çağırır; kullanıcı saat dilimi, harcama bulunup bulunmadığı ve aynı gün bildirim gönderilip gönderilmediği kontrol edilir. GitHub zamanlaması gecikebilir; kesin dakikada teslim garantisi yoktur. Bu değişkenler olmadan iş etkinleşmez, mesaj göndermez. İsterseniz kendi zamanlayıcınızdan aynı uç noktayı çağırabilirsiniz.

Testler: `node --test tests/*.test.cjs`.
