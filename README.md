# Istanbul Hostel — Akıllı Hostel Yönetimi ve Misafir Deneyimi Platformu

Medya 333 tarafından geliştirilen demo platform. Bağımsız hosteller ve butik oteller için çok dilli web sitesi, doğrudan rezervasyon, QR misafir rehberi, tur/aktivite talepleri, housekeeping ve yönetim panelini tek bir Next.js uygulamasında birleştirir.

> **Demo içerik:** Fiyatlar, yorumlar, adres ve iletişim bilgileri örnektir. Gerçek bir işletmeye ait değildir.

## Teknoloji

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS 4 · shadcn/ui tarzı bileşenler (Radix) · Lucide · PostgreSQL · Prisma 7 · Zod 4 · `qrcode` · bcrypt. Paket yöneticisi: **npm**.

## Kurulum

Gereksinimler: Node.js 20.19+ (22 önerilir), PostgreSQL 14+.

```bash
npm install                 # prisma generate otomatik çalışır
cp .env.example .env        # DATABASE_URL, SESSION_SECRET, APP_URL, DEMO_PASSWORD değerlerini doldurun
npx prisma migrate deploy   # şemayı oluşturur
npm run db:seed             # demo verilerini yükler (mevcut veriyi SİLER)
npm run dev                 # http://localhost:3000
```

Üretim için: `npm run build && npm start`.

### Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `SESSION_SECRET` | Oturum token'larını hash'lemek için 32+ bayt rastgele değer (`openssl rand -hex 32`) |
| `APP_URL` | Genel alan adı. QR kodları bu adrese yönlenir — basmadan önce ayarlayın |
| `DEMO_PASSWORD` | Seed'in tüm demo hesaplarına verdiği şifre. Boşsa rastgele üretilip konsola yazılır |
| `DEMO_MODE` | `true` ise giriş sayfasında demo hesap kısayolları görünür. **Canlı ortamda asla açmayın** |

### Demo hesapları (seed sonrası)

| Rol | E-posta | Erişim |
|---|---|---|
| Yönetici | admin@istanbulhostel.example | Her şey |
| Müdür | manager@istanbulhostel.example | Personel hesapları ve ayarlar hariç her şey |
| Resepsiyon | reception@istanbulhostel.example | Rezervasyonlar, misafirler, turlar, rehber, QR, görevler |
| Housekeeping | ayse@ / mehmet@ / lejla@istanbulhostel.example | Yalnızca `/staff` uygulaması |

Şifre: `.env` içindeki `DEMO_PASSWORD`.

Misafir rehberini denemek için: `/guest?room=101` → **Oda hizmetleri** → referans `IH-DEMO24`, soyad `Fischer`.

## Adresler

| Yol | İçerik |
|---|---|
| `/en`, `/bs`, `/tr` | Genel web sitesi. İlk ziyarette dil ülkeye göre seçilir: BA/HR/RS/ME → Boşnakça, diğer herkes → İngilizce. Seçim hatırlanır. Mantık `src/proxy.ts` içinde. |
| `/{dil}/book` | Rezervasyon talebi akışı |
| `/guest` | QR misafir rehberi — resepsiyondaki tek QR kod buraya yönlenir (dile göre yönlendirir) |
| `/staff` | Housekeeping mobil uygulaması |
| `/admin` | Yönetim paneli (11 bölüm) |
| `/login` | Personel girişi |

## Mimari notlar

- **Stok ve müsaitlik** (`src/server/availability.ts`): Yatakhaneler yatak bazında, özel odalar oda bazında satılır. Müsaitlik = aktif ve engellenmemiş stok − çakışan *onaylı* tahsisler. Bekleyen talepler stok düşmez; onay anında `Serializable` bir transaction içinde gerçek yatak/oda atanır, böylece aynı son yatağı iki kişiye vermek mümkün değildir.
- **Doluluk ve housekeeping ayrıdır**: Doluluk rezervasyon tahsislerinden hesaplanır; temizlik durumu odada ayrı tutulur ve her değişiklik `HousekeepingLog` tablosuna yazılır.
- **Çok dillilik** (`src/i18n`): Arayüz metinleri tipli sözlüklerde (EN/BS), veritabanı içerikleri `{ en, bs }` JSON alanlarında. Türkçe kaldırıldı; eski `/tr` adresleri İngilizceye yönlenir. Çevrilmemiş alanlar İngilizceye düşer. Yönetim paneli İngilizcedir.
- **Kimlik doğrulama** (`src/server/auth.ts`): bcrypt (cost 12), veritabanında hash'lenmiş oturum token'ları, httpOnly çerez, 15 dakikada 5 hatalı denemede kilit. Rol kontrolleri her sayfada ve her server action'da sunucu tarafında yapılır (`PERMISSIONS` tablosu). `proxy.ts` yalnızca iyimser yönlendirme yapar.
- **Misafir doğrulama**: QR'daki oda numarası yetki vermez. Oda hizmetleri için rezervasyon referansı + soyad gerekir; başarılı doğrulama çıkış gününe kadar geçerli bir oturum açar.
- **Denetim kaydı**: Önemli değişiklikler `AuditLog` tablosuna yazılır (Ayarlar → Audit log).
- **Yüklemeler** (`src/server/uploads.ts`): Görseller `storage/uploads` klasörüne kaydedilir ve `/media/...` üzerinden sunulur; dosya türü içerikten doğrulanır, 5 MB sınırı vardır. Sunucusuz ortamda bu modülü S3/R2 ile değiştirin.
- **Hız sınırı** (`src/lib/rate-limit.ts`): Genel formlar için bellek içi sınırlayıcı. Birden fazla sunucuda Redis ile değiştirin.
- **Kanal yöneticisi**: Booking.com/Hostelworld senkronizasyonu yoktur; `Reservation.source` alanı ve `availability.ts` ileride bir entegrasyon için tek giriş noktasıdır.

## Başka bir işletmeye uyarlama

1. Yönetim paneli → **Settings**: ad, adres, telefon, WhatsApp, e-posta, yorum sayfası, "Demo mode" anahtarı.
2. **Rooms & Beds**: oda tipleri, fiyatlar, fotoğraflar, odalar ve yatak sayıları.
3. **Website Content**: ana sayfa başlığı ve görseli, SSS, yorumlar.
4. **Guest Guide**: Wi-Fi, kahvaltı, kurallar, olanaklar, ulaşım, yerel öneriler.
5. Renkler ve yazı tipleri: `src/app/globals.css` (`@theme` token'ları) ve `src/lib/fonts.ts`. Logo: `src/components/brand/logo.tsx`, `src/app/icon.svg`.
6. Statik metinler: `src/i18n/dictionaries/*.ts`.

## GitHub + Vercel ile yayınlama

1. Projeyi GitHub'a gönderin (boş bir repo oluşturup `git push`).
2. vercel.com → **Add New → Project** → GitHub reposunu seçin. Framework otomatik olarak Next.js algılanır.
3. Proje içinde **Storage** sekmesinden:
   - **Neon (Postgres)** ekleyin → `DATABASE_URL` ve `DATABASE_URL_UNPOOLED` otomatik tanımlanır.
   - **Blob** ekleyin → `BLOB_READ_WRITE_TOKEN` otomatik tanımlanır (panelden yüklenen fotoğraflar için).
4. **Settings → Environment Variables**: `SESSION_SECRET`, `APP_URL` (ör. `https://istanbul-hostel.vercel.app`), `DEMO_PASSWORD`, `DEMO_MODE=false`.
5. **Deploy**. `vercel.json` derleme sırasında migration'ları uygular ve veritabanı boşsa demo verisini bir kez yükler; dolu veritabanına dokunmaz.

Notlar: Bölge `fra1` (Frankfurt) olarak ayarlıdır; Neon veritabanını da Frankfurt'ta oluşturun. Form hız sınırı sunucu örneği başına çalışır; yoğun trafikte Upstash Redis ile değiştirin.

## Komutlar

```bash
npm run dev         # geliştirme sunucusu
npm run build       # üretim derlemesi
npm run typecheck   # TypeScript kontrolü
npm run lint        # ESLint
npm run db:migrate  # yeni migration oluştur
npm run db:seed     # demo verisini yeniden yükle
```

## Fotoğraflar

Tüm fotoğraflar Unsplash Lisansı ile kullanılmıştır; fotoğrafçılar ve kaynaklar `public/images/CREDITS.md` dosyasındadır.

## Canlıya almadan önce

- `DEMO_MODE` kapalı olsun; seed hesaplarını silin veya şifrelerini değiştirin.
- `APP_URL` gerçek alan adı olsun, HTTPS kullanın.
- Gizlilik politikası ve şartlar şablon metindir; bir hukukçuya inceletin.
- Örnek yorumları gerçek ve izinli yorumlarla değiştirin.
