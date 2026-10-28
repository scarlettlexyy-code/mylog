# MYlog — Operational Energy & Cost Monitoring

**Vila:** Agranusa Signature Villa  
**Versi Dokumen:** 1.3 (Lintas Agen AI — Next.js + TypeScript + Google Sheets + Vercel + PWA Builder)  
**Bahasa:** Indonesia  
**Mata Uang:** Rupiah (IDR)  
**Zona Waktu:** Asia/Makassar (WITA)  
**Database Persisten:** Satu Google Sheets Master (Single Source of Truth)

---

## 1. Ringkasan Produk

MYlog adalah aplikasi internal monitoring utilitas energi dan pengeluaran operasional harian untuk manajemen Agranusa Signature Villa. Aplikasi ini **bukan** sistem transaksi kasir atau payment gateway; melainkan instrumen kendali biaya, deteksi dini lonjakan konsumsi, dan kepatuhan pagu anggaran bulanan.

### 5 Komponen Pemantauan Utama:
1. **Listrik (PLN Utama):** Pembacaan kumulatif meter gardu (kWh), kalkulasi selisih interval harian, dan estimasi biaya tarif PLN.
2. **Air (PDAM & Deep Well):** Pembacaan kumulatif flowmeter (m³), konsumsi harian, dan estimasi biaya.
3. **Gas (Sentral Kitchen & Boiler):** Pembacaan kumulatif meter gas (m³), konsumsi kubikasi, dan estimasi biaya.
4. **Fuel (Solar Genset):** Kuantitas liter terpakai harian (non-meter) dan status jam operasional running test genset.
5. **Pengeluaran Operasional (Opex):** Total nominal kas harian (Rp) tanpa rincian per nota/vendor (sesuai regulasi PRD Bagian 9 demi kecepatan operasional).

---

## 2. Arsitektur Deployment Wajib

```
[ PWA Client / Mobile Browser ]
             │ (HTTPS)
             ▼
[ Next.js 14 App Router di Vercel ]
   ├── Frontend UI (Google Stitch Hospitality Luxury Design System)
   └── Server-Side Route Handlers (/api/*)
             │
             ├── Akses Langsung Supervisor (Tanpa Form Login)
             │
             ▼ (Google Sheets API v4 via Service Account JWT)
[ 1 File Google Sheets Master (10 Dedicated Tabs) ]
```

---

## 3. Struktur 10 Tab Google Sheets (PRD Bagian 14)

Semua data operasional tersimpan secara eksklusif pada **satu file Google Sheets** dengan 10 tab berikut:

| Nama Tab | Deskripsi Kolom Utama |
|---|---|
| `DailyReadings` | `id`, `date`, `electricityMeter`, `waterMeter`, `gasMeter`, `recordedAt`, `recordedBy`, `isArchived`, `version` |
| `FuelUsage` | `id`, `date`, `solarLiters`, `gensetStatus`, `recordedAt`, `recordedBy`, `isArchived`, `version` |
| `OperatingExpenses` | `id`, `date`, `totalAmount`, `recordedAt`, `recordedBy`, `isArchived`, `version` |
| `MeterCycles` | `id`, `utility`, `resetDate`, `oldMeterFinal`, `newMeterBaseline`, `reason`, `recordedBy`, `recordedAt` |
| `IntervalAllocations` | `id`, `utility`, `startDate`, `endDate`, `totalConsumption`, `allocatedByDayJson`, `reason` |
| `TariffConfig` | `id`, `utility`, `effectiveDate`, `baseRatePerUnit`, `monthlyFixedCost`, `percentageComponentRate`, `percentageBasis`, `isConfigured` |
| `TariffHistory` | Riwayat arsip perubahan tarif dan tanggal efektif |
| `MonthlyBudgets` | `id`, `month`, `mode`, `electricityBudget`, `waterBudget`, `gasBudget`, `fuelBudget`, `opexBudget`, `totalBudget`, `isConfigured`, `updatedAt`, `updatedBy` |
| `AuditLog` | `id`, `timestamp`, `action`, `dataType`, `recordId`, `targetDate`, `previousValue`, `newValue`, `reason`, `userEmail` |
| `AppSettings` | `key`, `value`, `updatedAt` |

---

## 4. Variabel Lingkungan (.env)

Salin `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi variabel konfigurasi berikut:

```ini
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID="1AbC_your_actual_google_sheets_id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="mylog-bot@your-gcp-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"

# Google Sign-In & Access Allowlist (PRD Bagian 4.4)
GOOGLE_ALLOWED_EMAIL="owner@agranusavilla.com"
GOOGLE_OAUTH_CLIENT_ID="your_google_oauth_client_id.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="your_google_oauth_client_secret"

# Keamanan Sesi Cookie
SESSION_SECRET="kombinasi_acak_minimal_32_karakter_rahasia_untuk_enkripsi_sesi"
NEXT_PUBLIC_APP_URL="https://mylog.vercel.app"
APP_ENV="production"
```

---

## 5. Menjalankan Aplikasi Secara Lokal

### Prasyarat
- Node.js versi 18.17+ atau 20+
- npm atau pnpm

### Langkah Instalasi
```bash
# 1. Masuk ke folder proyek
cd mylog

# 2. Pasang dependensi
npm install

# 3. Jalankan pengujian formula & validasi bisnis (PRD 10 & 12)
npm test

# 4. Jalankan server pengembangan lokal
npm run dev
```

Buka peramban di `http://localhost:3000`.

---

## 6. Prosedur Setup Google Cloud & Google Sheets

1. Buat proyek baru di [Google Cloud Console](https://console.cloud.google.com).
2. Aktifkan **Google Sheets API**.
3. Buat **Service Account** baru:
   - Masuk ke *IAM & Admin* → *Service Accounts* → *Create Service Account*.
   - Buat kunci JSON (*Keys* → *Add Key* → *Create new key* → *JSON*).
   - Salin nilai `client_email` ke `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
   - Salin nilai `private_key` ke `GOOGLE_PRIVATE_KEY`.
4. Buat satu spreadsheet Google Sheets baru dengan nama `MYlog_Agranusa_Master`.
5. Salin ID spreadsheet dari URL ke `GOOGLE_SHEETS_SPREADSHEET_ID`.
6. **Bagikan (Share) spreadsheet** tersebut kepada email service account dengan hak akses **Editor**.

---

## 7. Prosedur Deployment Vercel

1. Buat repositori GitHub baru dengan visibilitas **Private**.
2. Push source code proyek ke branch `main`:
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi MYlog Next.js App Router v1.3"
   git branch -M main
   git remote add origin https://github.com/USERNAME/mylog-agranusa.git
   git push -u origin main
   ```
3. Hubungkan repositori GitHub ke [Vercel](https://vercel.com).
4. Di bagian **Settings → Environment Variables**, masukkan seluruh variabel dari poin 4 sebagai **Encrypted Secrets**.
5. Klik **Deploy**.
6. Verifikasi deployment pada URL produksi ber-HTTPS (`https://mylog-xxx.vercel.app`).

---

## 8. Verifikasi & Pengemasan PWA (PWA Builder)

1. Buka [PWABuilder.com](https://www.pwabuilder.com).
2. Masukkan URL HTTPS produksi Vercel Anda.
3. Evaluasi skor kelayakan PWA:
   - **Manifest:** Terverifikasi valid (`display: standalone`, `theme_color: #0b1c30`, nama `MYlog`).
   - **Service Worker:** Terverifikasi aktif dengan perlindungan privasi PRD Bagian 7 (hanya cache app shell statis, tidak pernah meng-cache data biaya/API).
   - **Icons:** Terverifikasi 192×192 dan 512×512 maskable generic icons (bukan logo perusahaan).
4. Klik **Package for Stores** jika ingin menghasilkan paket APK Android / Windows.

---

## 9. Status Konfigurasi Menunggu Pemilik (PRD Bagian 19)

| Parameter | Status Saat Ini | Keterangan Tindakan |
|---|---|---|
| ID Google Sheets Produksi | Menunggu input pemilik | Diisi di environment variable `GOOGLE_SHEETS_SPREADSHEET_ID` |
| Akun Google Service Account | Menunggu input pemilik | Diisi di `GOOGLE_SERVICE_ACCOUNT_EMAIL` & `GOOGLE_PRIVATE_KEY` |
| Email Pemilik Terdaftar | `owner@agranusavilla.com` | Sesuaikan dengan email Google pemilik resmi |
| Nilai Tarif Resmi PLN/PDAM/Gas | Estimasi Mockup Lapangan | Diisi angka resmi kontrak saat dokumen tarif tersedia |
| Plafon Pagu Anggaran Resmi | Rp 50.000.000 (Mockup) | Disesuaikan tiap bulan via menu *Atur Pagu Baru* |
| Logo Perusahaan | Dilarang / Tidak Tersedia | Menggunakan identitas teks tipografi murni `MYlog — Agranusa Signature Villa` |

---

*Hak Cipta © 2026 Agranusa Signature Villa. Seluruh hak cipta dilindungi.*
