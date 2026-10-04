# Yeni yazı bildirimleri: kurulum

Sitenin altındaki **Bildirimleri aç** düğmesi, bilgisayar ve Android tarayıcılarında
çalışır (iPhone ve iPad'de gösterilmez). Düğmeye basan ziyaretçinin aboneliği bir Google
E-Tablo'ya yazılır. `main`'e yeni bir yazı girdiğinde GitHub Action (`notify.yml`)
abonelere bildirim gönderir.

```
tarayıcı --(abone ol)--> Apps Script --> Google E-Tablo
                                              ^
GitHub Action (yeni yazı) --(listele / sil)---+
        |
        +--(web push)--> tarayıcının bildirim hizmeti --> ziyaretçinin cihazı
```

Bu adımlar tamamlanana kadar `_config.yml` içindeki `push` alanları boş kalır ve site
bildirim düğmesini göstermez, Action da hiçbir şey yapmadan çıkar.

## 1. Anahtar çifti üretin

Kendi bilgisayarınızda, depo klasöründe:

```
npm ci
npx web-push generate-vapid-keys
```

- **Public Key**: `_config.yml` içinde `push.public_key` alanına yazılacak (gizli değil).
- **Private Key**: yalnızca GitHub'a gizli değişken olarak girilecek (adım 5). Kimseyle
  paylaşmayın, sohbete ya da depoya yazmayın.

## 2. E-Tabloyu açın

1. Yeni bir Google E-Tablo oluşturun, adı "Satranç Kahvesi bildirimleri" olsun.
2. Alttaki sayfa sekmesinin adını **Abonelikler** yapın. Kod ilk satırı başlık sayar;
   A1:D1 hücrelerine sırayla `endpoint`, `p256dh`, `auth`, `kayit` yazın.
3. Tabloyu kimseyle paylaşmayın.

## 3. Apps Script'i kurun

1. E-Tabloda **Uzantılar → Apps Script** menüsünü açın.
2. Açılan düzenleyicideki kodu silip `scripts/push/apps-script.gs` dosyasının içeriğini
   yapıştırın, kaydedin.
3. Sol menüde **Proje ayarları → Komut dosyası özellikleri → Komut dosyası özelliği ekle**:
   - Özellik: `ADMIN_SECRET`
   - Değer: en az 32 karakterlik rastgele bir parola (ör. `openssl rand -hex 32` çıktısı).
     Aynı değeri adım 5'te GitHub'a da gireceksiniz.
4. **Dağıt → Yeni dağıtım → Tür: Web uygulaması**:
   - Şu kullanıcı olarak çalıştır: **Ben**
   - Erişimi olanlar: **Herkes**
5. İlk dağıtımda Google tablo erişimi için izin ister. "Bu uygulama doğrulanmadı"
   uyarısı çıkarsa **Gelişmiş → (proje adı)'na git** deyip izin verin. Bu uyarıyı yalnızca
   siz görürsünüz.
6. Dağıtım bitince **Web uygulaması URL'sini** kopyalayın (`.../exec` ile biter).

Koda sonradan bir değişiklik yaparsanız: **Dağıt → Dağıtımları yönet → düzenle → Yeni
sürüm**. Aksi halde eski sürüm çalışmaya devam eder.

## 4. Siteye bağlayın

`_config.yml` içinde:

```yaml
push:
  endpoint: "https://script.google.com/macros/s/.../exec"
  public_key: "adım 1'deki Public Key"
```

## 5. GitHub'a gizli değişkenleri girin

Depoda **Settings → Secrets and variables → Actions → New repository secret**:

| Ad | Değer |
|---|---|
| `VAPID_PRIVATE_KEY` | adım 1'deki Private Key |
| `PUSH_ADMIN_SECRET` | adım 3'teki `ADMIN_SECRET` değeri |

## 6. Deneyin

1. Siteyi yayına alın, bilgisayarda ya da Android'de **Bildirimleri aç** düğmesine basıp
   izin verin. E-Tabloda bir satır oluşmalı. Düğme **Bildirimleri kapat** olur; ona basınca
   satır silinmeli.
2. Tekrar abone olun. GitHub'da **Actions → Notify subscribers → Run workflow** ile
   mevcut bir yazıyı girin (ör. `_posts/2026-09-20-once-hamle-yap-sonra-dusun.md`).
   Birkaç saniye içinde bildirim gelmeli.
3. Yeni bir yazı `main`'e girince bildirim kendiliğinden gider. Action, yazının sitede
   yayına girmesini bekler (en çok 15 dakika) ve ondan sonra gönderir.

## Notlar

- Geleceğe tarihli yazılar için bildirim gitmez (Jekyll da onları yayımlamaz).
- Bildirim göndermeyi denerken geçersiz çıkan abonelikler tablodan otomatik silinir.
- Abone listesini görmek ya da biri için silme yapmak isterseniz tabloyu doğrudan düzenleyin.
- Tarayıcılar yalnızca belli bildirim hizmetlerine izin verir (Google, Mozilla, Microsoft,
  Apple). Başka adresler hem Apps Script'te hem `scripts/send-push.mjs`'te reddedilir.
- Gizlilik sayfasındaki "Yeni yazı bildirimleri" bölümü `push` alanları dolunca görünür.
