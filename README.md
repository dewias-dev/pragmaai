# PRAGMAAI

**Intelligent Pragmatic Speech Act Analysis**
Aplikasi web untuk menganalisis tindak tutur ilokusi berdasarkan teori John R. Searle.

PragmaAI membaca dialog, transkrip film, atau wawancara, memecahnya menjadi unit tuturan, lalu mengklasifikasikan setiap tuturan ke dalam lima kategori Searle (asertif, direktif, komisif, ekspresif, deklaratif) lengkap dengan illocutionary point, F(p), IFIDs, direction of fit, psychological state, felicity conditions, serta penjelasan akademik dan sederhana.

---

## Daftar isi

1. [Fitur](#1-fitur)
2. [Teknologi](#2-teknologi)
3. [Struktur proyek](#3-struktur-proyek)
4. [Yang perlu disiapkan](#4-yang-perlu-disiapkan)
5. [Menjalankan di komputer (Windows PowerShell)](#5-menjalankan-di-komputer-windows-powershell)
6. [Menguji aplikasi](#6-menguji-aplikasi)
7. [Upload ke GitHub](#7-upload-ke-github)
8. [Deploy ke Vercel](#8-deploy-ke-vercel)
9. [Keamanan](#9-keamanan)
10. [Cara kerja analisis AI](#10-cara-kerja-analisis-ai)
11. [Mengatasi masalah](#11-mengatasi-masalah)
12. [Peta tahapan belajar](#12-peta-tahapan-belajar)

---

## 1. Fitur

| Fitur | Keterangan |
|---|---|
| **Akun** | Register, login, logout, lupa kata sandi, profil, ubah kata sandi |
| **Role** | Admin dan User. Role baru selalu User; hanya admin yang dapat mengubah role orang lain |
| **Dashboard** | Sapaan dengan pintasan, notifikasi (analisis selesai, umpan balik ditinjau, umpan balik baru untuk admin), jumlah analisis, jumlah tuturan, kategori dominan, persentase tindak tidak langsung, grafik distribusi lima kategori, grafik analisis per bulan, riwayat terbaru. Admin juga melihat ringkasan sistem (hanya angka agregat) |
| **Form analisis** | Judul, sumber data, konteks, nama pembicara (bisa dideteksi otomatis), teks dialog sampai 20.000 karakter, tombol isi contoh |
| **Analisis AI** | Segmentasi tuturan, penutur & mitra tutur, kategori Searle, tindak ilokusi spesifik, tingkat keyakinan, kategori alternatif, illocutionary point, propositional content, F(p), IFIDs, bukti linguistik, direction of fit, psychological state, empat felicity conditions, langsung/tidak langsung, penjelasan akademik & sederhana |
| **Kejujuran analisis** | Kategori "Belum dapat dipastikan" bila konteks kurang; status "Informasi tidak cukup" untuk felicity condition yang tidak bisa dinilai; penanda "Kutipan perlu dicek" bila teks hasil AI tidak persis sama dengan teks asli |
| **Hasil analisis** | Grafik & tabel distribusi (jumlah dan persentase dihitung dari data), ringkasan, kesimpulan akademik & sederhana, temuan dominan, keterbatasan, tabel klasifikasi dengan filter, detail per tuturan, data asli |
| **Riwayat** | Daftar analisis milik sendiri, cari judul, urutkan tanggal/judul, halaman, lihat, hapus |
| **Knowledge base** | 8 materi awal (pragmatik, teori tindak tutur, Searle, lima kategori, felicity conditions, langsung/tidak langsung, contoh analisis, panduan membaca hasil). Admin dapat menambah, mengedit (Markdown + pratinjau), menerbitkan, dan menghapus |
| **Export** | Unduh PDF, export Excel (3 sheet), cetak langsung dari browser |
| **Umpan balik** | Pengguna menilai hasil (bintang 1–5) dan melaporkan klasifikasi keliru; admin meninjau dan memberi catatan |
| **Tampilan** | Gaya dasbor lembut (putih–biru–navy): sidebar ikon dengan tooltip, topbar berisi pencarian, tanggal, notifikasi, dan menu akun, kartu sapaan dengan maskot PragmaAI, kartu statistik berikon pastel. Responsif untuk laptop, tablet, dan ponsel |

## 2. Teknologi

- **Frontend**: React 19 + Vite 8 (JavaScript/JSX), React Router 8, Recharts, Lucide icons
- **Backend**: Vercel Serverless Functions (folder `api/`)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **AI**: OpenRouter (default model gratis `nvidia/nemotron-3-ultra-550b-a55b:free`) atau OpenAI (`gpt-5.4-mini`), dipilih lewat `AI_PROVIDER`
- **Export**: jsPDF + jspdf-autotable (PDF), SheetJS (Excel)
- **Pengujian**: `node:test` + PGlite (PostgreSQL asli di Node.js untuk menguji RLS)

## 3. Struktur proyek

```
analisis-pragmatik/
├─ api/                      Backend (Vercel Functions)
│  ├─ analyze.js             POST /api/analyze  → menjalankan analisis AI
│  └─ health.js              GET  /api/health   → cek konfigurasi server
├─ server/                   Logika backend yang dipakai api/
│  ├─ config.js              Membaca environment variable
│  ├─ http.js                Format respons & error
│  ├─ supabaseAdmin.js       Verifikasi login, kuota harian
│  ├─ validation.js          Validasi input form
│  ├─ prompts.js             Instruksi AI berbasis teori Searle
│  ├─ schemas.js             Skema JSON wajib untuk jawaban AI
│  ├─ aiClient.js            Pemanggilan OpenRouter/OpenAI, pembacaan JSON, pesan error
│  ├─ pipeline.js            Alur: segmentasi → klasifikasi → statistik → kesimpulan
│  ├─ verbatim.js            Cek kutipan tuturan terhadap teks asli
│  └─ saveAnalysis.js        Menyimpan hasil ke database
├─ shared/                   Dipakai frontend & backend
│  ├─ searle.js              Definisi lima kategori, notasi, felicity conditions
│  ├─ limits.js              Batas panjang input
│  └─ stats.js               Perhitungan jumlah & persentase
├─ src/                      Frontend React
│  ├─ components/            Komponen (grafik, badge, kartu tuturan, dialog, dll.)
│  ├─ hooks/                 useAuth, useDocumentTitle, useDebouncedValue, useMediaQuery
│  ├─ layouts/               AppLayout (sidebar) & AuthLayout (login/register)
│  ├─ lib/                   Klien Supabase & konteks login
│  ├─ pages/                 Semua halaman (termasuk pages/admin/)
│  ├─ services/              Akses data Supabase, API, export
│  ├─ utils/                 Format tanggal/angka, pesan error, contoh dialog
│  ├─ App.jsx                Peta halaman (routing)
│  ├─ main.jsx               Titik awal aplikasi
│  └─ index.css              Sistem desain & gaya cetak
├─ supabase/
│  ├─ schema.sql             Tabel, trigger, fungsi, hak akses, RLS
│  ├─ seed_knowledge_base.sql  Materi awal knowledge base
│  └─ make_admin.sql         Menjadikan akun sebagai admin
├─ tests/                    Uji otomatis (npm test)
├─ public/favicon.svg
├─ .env.example              Contoh environment variable
├─ vercel.json               Konfigurasi Vercel (durasi fungsi, rewrite, header keamanan)
├─ vite.config.js            Konfigurasi Vite + server API lokal
└─ package.json
```

## 4. Yang perlu disiapkan

| Kebutuhan | Keterangan |
|---|---|
| **Node.js 24 LTS** | Unduh di nodejs.org, pilih versi LTS. Minimal versi 22.22 |
| **Git** | Unduh di git-scm.com |
| **VS Code** | Unduh di code.visualstudio.com |
| **Akun Supabase** | supabase.com, paket gratis cukup |
| **Akun OpenRouter** | openrouter.ai, gratis dan tanpa kartu kredit untuk model `:free`. (Alternatif berbayar: akun OpenAI Platform) |
| **Akun GitHub & Vercel** | Untuk deployment (Vercel bisa login memakai akun GitHub) |

Cek di PowerShell (tutup dan buka lagi PowerShell setelah instalasi):

```powershell
node -v
npm -v
git --version
```

Jika muncul error `running scripts is disabled on this system`, jalankan sekali:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## 5. Menjalankan di komputer (Windows PowerShell)

### Langkah 5.1 – Ekstrak dan instal dependensi

Simpan zip di luar folder OneDrive (misalnya `C:\proyek`), lalu:

```powershell
mkdir C:\proyek -Force
Expand-Archive -Path "$HOME\Downloads\pragmaai.zip" -DestinationPath C:\proyek
cd C:\proyek\analisis-pragmatik
npm install
code .
```

### Langkah 5.2 – Buat proyek Supabase dan database

1. Masuk ke supabase.com → **New project**. Isi nama (misalnya `pragmaai`), buat database password, pilih region **Southeast Asia (Singapore)**. Tunggu sampai proyek siap.
2. Buka **SQL Editor** → **New query**. Buka file `supabase/schema.sql` di VS Code, salin **seluruh isinya**, tempel, lalu klik **Run**. Harus muncul *Success*.
3. Buat query baru lagi, tempel seluruh isi `supabase/seed_knowledge_base.sql`, lalu **Run**.
4. Buka **Table Editor**: harus ada tabel `profiles`, `analyses`, `utterances`, `knowledge_base`, dan `analysis_feedback`. Tabel `knowledge_base` berisi 8 materi.
5. Buka **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:5173` (nanti diganti alamat Vercel)
   - **Redirect URLs**: tambahkan `http://localhost:5173/**`
6. *(Opsional untuk uji coba)* **Authentication → Sign In / Providers → Email**: matikan **Confirm email** agar akun baru bisa langsung login tanpa membuka email. Nyalakan lagi sebelum aplikasi dipakai banyak orang.

Kedua file SQL aman dijalankan ulang bila Anda ragu apakah sudah berhasil.

### Langkah 5.3 – Ambil kunci Supabase

Di Supabase, klik **Connect** (atas dashboard) atau buka **Project Settings → API Keys**:

| Yang dicari | Dipakai untuk |
|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | `VITE_SUPABASE_URL` dan `SUPABASE_URL` |
| **Publishable key** (`sb_publishable_...`), atau *anon public* key pada tampilan lama | `VITE_SUPABASE_PUBLISHABLE_KEY` |
| **Secret key** (`sb_secret_...`), atau *service_role* key pada tampilan lama | `SUPABASE_SERVICE_ROLE_KEY` |

> Secret/service_role key dapat melewati semua aturan keamanan database. Jangan pernah membagikannya, menaruhnya di kode, atau mengawalinya dengan `VITE_`.

### Langkah 5.4 – Ambil API key AI (OpenRouter)

1. Buka **openrouter.ai** → **Sign in**. Daftar memakai Google, GitHub, atau email. Tidak perlu kartu kredit.
2. Buka menu **Keys** (dari foto profil atau openrouter.ai/settings/keys) → **Create Key**. Beri nama `pragmaai`, biarkan pengaturan lain apa adanya, lalu buat kuncinya.
3. Salin kuncinya (diawali `sk-or-...`). Kunci hanya ditampilkan sekali; jika terlewat, hapus lalu buat baru.

Hal yang perlu diketahui tentang model gratis `nvidia/nemotron-3-ultra-550b-a55b:free`:

| Hal | Keterangan |
|---|---|
| Biaya | Gratis |
| Kuota | 20 permintaan per menit dan 50 per hari. Setelah pembelian kredit minimal US$10 (sekali seumur akun), kuota naik menjadi 1.000 per hari |
| Pemakaian per analisis | Sekitar 1 + (jumlah tuturan ÷ 5) + 1 permintaan. Dialog 10 tuturan ≈ 4 permintaan, 30 tuturan ≈ 8 permintaan |
| Kecepatan | Lebih lambat daripada model berbayar; satu analisis biasanya 1–4 menit |
| Panjang dialog | Dibatasi otomatis sampai 40 unit tuturan per analisis agar selesai dalam batas waktu server |
| Privasi | Penyedia model gratis dapat mencatat isi permintaan untuk meningkatkan layanannya. **Jangan gunakan data pribadi atau rahasia**, misalnya transkrip wawancara dengan nama asli narasumber |
| Format jawaban | Model gratis tidak dijamin mengikuti format JSON. PragmaAI membersihkan jawaban dan meminta ulang sekali bila formatnya rusak |

Daftar model dan kuota di OpenRouter dapat berubah. Jika model ini dihentikan, ganti `OPENROUTER_MODEL` dengan model lain dari openrouter.ai/models.

**Alternatif berbayar (OpenAI):** buat API key di platform.openai.com → **API keys**, isi saldo di **Billing**, lalu isi `AI_PROVIDER=openai` dan `OPENAI_API_KEY` di `.env.local`. OpenAI lebih cepat, format jawabannya dijamin, dan data tidak disimpan (`store: false`).

### Langkah 5.5 – Isi environment variable

```powershell
Copy-Item .env.example .env.local
```

Buka `.env.local` di VS Code dan isi nilainya:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
OPENROUTER_REASONING_EFFORT=none
ANALYSIS_DAILY_LIMIT=20
```

File `.env.local` sudah masuk `.gitignore`, jadi tidak akan ter-upload ke GitHub.

### Langkah 5.6 – Jalankan

```powershell
npm run dev
```

Buka `http://localhost:5173`. Perintah ini menjalankan frontend **dan** backend `api/` sekaligus, jadi Anda tidak perlu Vercel CLI di komputer.

Cek backend di `http://localhost:5173/api/health`. Hasil yang benar:

```json
{ "ok": true, "message": "Backend siap digunakan.", ... }
```

Hentikan server dengan **Ctrl + C**. Setiap kali mengubah `.env.local`, jalankan ulang `npm run dev`.

### Langkah 5.7 – Buat akun admin pertama

1. Di aplikasi, klik **Daftar sekarang**, lalu buat akun Anda.
2. Di Supabase **SQL Editor**, buka isi `supabase/make_admin.sql`, ganti email dengan email akun Anda, lalu **Run**.
3. Logout dan login lagi. Menu **Admin** (Kelola materi, Kelola pengguna, Umpan balik) akan muncul di sidebar.

Admin berikutnya cukup diatur dari menu **Kelola pengguna**.

## 6. Menguji aplikasi

### Uji otomatis

```powershell
npm test
npm run lint
npm run build
```

`npm test` menjalankan 44 pengujian tanpa internet dan tanpa biaya:

- **Database** (`tests/database.test.js`): menjalankan `schema.sql` dan `seed_knowledge_base.sql` di PostgreSQL asli (PGlite), lalu membuktikan bahwa pengguna hanya melihat datanya sendiri, admin pun tidak dapat membaca analisis orang lain, pengguna biasa tidak dapat menjadi admin sendiri, admin tidak dapat mengubah role dirinya, pengguna tanpa login tidak dapat membaca tabel apa pun, dan hasil analisis hanya bisa dibuat oleh backend.
- **Backend** (`tests/api.test.js`): login wajib, validasi input, kuota harian, error tidak membocorkan detail internal, `/api/health` tidak menampilkan nilai rahasia.
- **Logika** (`tests/logic.test.js`): perhitungan persentase, validasi, cek kutipan, kepatuhan skema JSON, dan alur analisis lengkap memakai OpenAI dan OpenRouter tiruan (termasuk jawaban JSON yang rusak, penolakan pengaturan penalaran, dan batas kuota).

### Uji manual (centang semuanya sebelum dipakai)

- [ ] Register akun baru, lalu login dan logout
- [ ] Lupa kata sandi: email terkirim, tautan membuka halaman profil, kata sandi baru tersimpan
- [ ] Profil: ubah nama dan institusi
- [ ] Analisis baru: klik **Isi contoh** → **Analisis dengan AI** → halaman hasil muncul (1–4 menit dengan model gratis)
- [ ] Hasil: grafik, tabel, persentase, kesimpulan, temuan dominan, detail tiap tuturan, felicity conditions
- [ ] Hasil: **Unduh PDF**, **Export Excel**, **Cetak**
- [ ] Hasil: kirim penilaian bintang dan laporkan satu tuturan
- [ ] Dashboard: angka dan grafik bertambah
- [ ] Riwayat: cari judul, ubah urutan, hapus analisis
- [ ] Knowledge base: buka materi
- [ ] Admin: tambah, edit, sembunyikan (draf), dan hapus materi
- [ ] Admin: jadikan akun lain admin lalu kembalikan menjadi pengguna
- [ ] Admin: tinjau umpan balik dan beri catatan; catatan terlihat oleh pengguna
- [ ] Login sebagai pengguna biasa: menu admin tidak muncul, dan alamat `/admin/materi` menampilkan "Halaman khusus admin"
- [ ] Buka di ponsel (atau mode responsif browser): menu ☰ berfungsi

## 7. Upload ke GitHub

1. Buat repository baru di github.com (misalnya `pragmaai`), **tanpa** README.
2. Di PowerShell, dari folder proyek:

```powershell
git config --global user.name "Nama Anda"
git config --global user.email "email-anda@contoh.com"
git init -b main
git add .
git status
```

3. Periksa hasil `git status`: **tidak boleh ada** `.env.local`, `node_modules`, atau `dist`. Harus ada `.env.example`.
4. Lanjutkan:

```powershell
git commit -m "PragmaAI versi 1"
git remote add origin https://github.com/USERNAME/pragmaai.git
git push -u origin main
```

## 8. Deploy ke Vercel

1. Masuk ke vercel.com → **Add New… → Project** → pilih repository `pragmaai` → **Import**.
2. **Framework Preset**: Vite (terdeteksi otomatis). Build command dan output sudah diatur di `vercel.json`.
3. Buka **Environment Variables**, tambahkan **semua** variabel dari `.env.local` (nama dan nilai yang sama):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_REASONING_EFFORT`, `ANALYSIS_DAILY_LIMIT`. Variabel yang kosong di `.env.local` tidak perlu ditambahkan.
4. Klik **Deploy**. Setelah selesai, catat alamatnya, misalnya `https://pragmaai.vercel.app`.
5. Kembali ke Supabase **Authentication → URL Configuration**:
   - **Site URL**: `https://pragmaai.vercel.app`
   - **Redirect URLs**: tambahkan `https://pragmaai.vercel.app/**` (biarkan `http://localhost:5173/**` untuk pengembangan)
6. Buka `https://pragmaai.vercel.app/api/health` → harus `"ok": true`.
7. Ulangi uji manual di bagian 6 pada alamat Vercel.

Setiap `git push` ke `main` otomatis membuat deployment baru. Bila environment variable diubah di Vercel, lakukan **Redeploy**.

> Batas durasi fungsi Vercel adalah 300 detik (5 menit). Dialog panjang dianalisis paralel agar selesai dalam batas itu. Jika muncul pesan batas waktu, bagi dialog menjadi beberapa analisis.

## 9. Keamanan

| Aturan | Penerapan |
|---|---|
| API key AI hanya di backend | `OPENROUTER_API_KEY`/`OPENAI_API_KEY` dibaca `server/config.js` dari environment variable tanpa awalan `VITE_`; tidak pernah dikirim ke browser |
| Service role key hanya di backend | Hanya dipakai `server/supabaseAdmin.js`, dan hanya setelah token login diverifikasi |
| Frontend hanya memakai publishable/anon key | `src/lib/supabase.js` |
| Autentikasi backend | `/api/analyze` menolak permintaan tanpa token Supabase yang sah; `user_id` diambil dari token, bukan dari data browser |
| Validasi input di backend | `server/validation.js`: panjang judul, konteks, dialog, nama pembicara; karakter kontrol dibersihkan |
| Row Level Security | Aktif di semua tabel. Pengguna hanya melihat & menghapus analisisnya sendiri. Admin hanya mendapat angka agregat, tidak dapat membaca isi analisis orang lain |
| Hasil analisis tidak bisa dipalsukan | Pengguna tidak punya izin INSERT/UPDATE pada `analyses` dan `utterances`; hanya backend yang menyimpan |
| Role tidak bisa diubah sendiri | Trigger `guard_profile_update` + izin per kolom; admin pun tidak dapat mengubah role dirinya |
| Pengunjung tanpa login | Tidak diberi akses ke tabel mana pun |
| Pengendalian biaya | Batas `ANALYSIS_DAILY_LIMIT` analisis per pengguna per 24 jam (admin tidak dibatasi) |
| Privasi data penelitian | OpenAI: `store: false`. OpenRouter model gratis: form analisis menampilkan peringatan agar pengguna tidak memasukkan data pribadi atau rahasia |
| Prompt injection | Teks dialog dikirim sebagai data JSON dan AI diperintahkan mengabaikan instruksi di dalam dialog |
| Error aman | Pesan error untuk pengguna jelas, tetapi detail teknis hanya dicatat di log server |
| Header keamanan | `vercel.json`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` |

## 10. Cara kerja analisis AI

```
Form → POST /api/analyze
   1. Verifikasi login & kuota
   2. Segmentasi   : AI memecah dialog menjadi unit tuturan (kutipan persis), menentukan penutur,
                     mitra tutur, dan menilai kecukupan konteks
   3. Klasifikasi  : tuturan dianalisis per kelompok 8 secara paralel dengan kerangka Searle
                     (tuturan yang terlewat diulang sekali)
   4. Verifikasi   : setiap kutipan dicocokkan dengan teks asli → penanda "Kutipan perlu dicek"
   5. Statistik    : jumlah & persentase dihitung oleh kode, bukan oleh AI
   6. Kesimpulan   : AI menyusun kesimpulan dari statistik yang sudah dihitung
   7. Simpan       : analyses + utterances di Supabase → halaman hasil
```

Semua jawaban AI wajib mengikuti skema JSON (`server/schemas.js`, Structured Outputs `strict: true`), sehingga format selalu konsisten. Instruksi linguistik lengkap ada di `server/prompts.js`, dan definisi kategori di `shared/searle.js` (dipakai bersama oleh prompt dan tampilan).

**Penyedia AI**: `AI_PROVIDER=openrouter` memakai Chat Completions OpenRouter. Skema JSON disertakan di instruksi dan di `response_format`, lalu jawaban dibersihkan (blok `<think>`, pagar kode) dan diminta ulang sekali bila rusak. `AI_PROVIDER=openai` memakai OpenAI Responses API dengan Structured Outputs yang menjamin format.

**Mengganti model**: ubah `OPENROUTER_MODEL` (atau `OPENAI_MODEL`). Model berbayar di OpenRouter otomatis mendapat batas 120 tuturan per analisis; model berakhiran `:free` dibatasi 40. Batas ini bisa diatur dengan `ANALYSIS_MAX_UTTERANCES`, sedangkan `AI_BATCH_SIZE` dan `AI_CONCURRENCY` mengatur ukuran kelompok dan jumlah permintaan paralel.

**Hasil AI adalah analisis awal.** Peneliti tetap perlu memverifikasi setiap klasifikasi sebelum digunakan dalam karya ilmiah.

## 11. Mengatasi masalah

| Gejala | Penyebab & solusi |
|---|---|
| Halaman "Konfigurasi belum lengkap" | `.env.local` belum dibuat atau `VITE_SUPABASE_*` kosong. Isi, lalu jalankan ulang `npm run dev` |
| `npm` error "running scripts is disabled" | Jalankan `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| "Vite requires Node.js version…" | Instal Node.js 24 LTS, tutup dan buka lagi PowerShell |
| "Profil pengguna tidak dapat dimuat" | `schema.sql` belum dijalankan, atau akun dibuat sebelum skema. Jalankan ulang `schema.sql` (aman diulang) |
| Login: "Email belum dikonfirmasi" | Buka email konfirmasi, atau matikan **Confirm email** saat uji coba (Langkah 5.2) |
| "Server belum dikonfigurasi. Isi environment variable: …" | Variabel backend kosong di `.env.local` atau di Vercel. Cek `/api/health` |
| "OPENROUTER_API_KEY tidak valid" | Salin ulang API key dari openrouter.ai → Keys |
| "Batas pemakaian model gratis OpenRouter tercapai" | Kuota 20/menit atau 50/hari habis, atau server model penuh. Tunggu beberapa menit, coba besok, atau beli kredit US$10 untuk 1.000 permintaan per hari |
| "Saldo OpenRouter habis atau minus" | Saldo di bawah nol menghentikan model gratis juga. Isi ulang di openrouter.ai → Credits |
| "Model … tidak ditemukan atau sudah tidak tersedia" | Model gratis bisa dihentikan. Pilih model lain di openrouter.ai/models dan ubah `OPENROUTER_MODEL` |
| "Model … tidak mengembalikan data dengan format yang benar" | Model gratis kadang keluar dari format. Coba lagi; jika sering terjadi, ganti model |
| "Dialog berisi … melebihi batas 40" | Batas model gratis. Bagi dialog menjadi beberapa analisis |
| "OPENAI_API_KEY tidak valid" / "saldo OpenAI habis" | Hanya bila `AI_PROVIDER=openai`. Periksa API key dan Billing di platform.openai.com |
| "Waktu analisis habis" | Dialog terlalu panjang; bagi menjadi beberapa analisis |
| "Batas … analisis per 24 jam" | Kuota harian tercapai; ubah `ANALYSIS_DAILY_LIMIT` bila perlu |
| Tautan email mengarah ke localhost setelah deploy | Perbarui **Site URL** dan **Redirect URLs** di Supabase (Langkah 8.5) |
| Halaman 404 saat refresh di Vercel | Pastikan `vercel.json` ikut ter-upload ke GitHub |
| `permission denied for table …` | Jalankan ulang `schema.sql` agar hak akses (GRANT) terpasang |

## 12. Peta tahapan belajar

Jika ingin mempelajari kode secara bertahap, ikuti urutan ini:

| Tahap | Topik | File yang dipelajari |
|---|---|---|
| 1 | Inisialisasi proyek & dependensi | `package.json`, `vite.config.js`, `index.html`, `src/main.jsx` |
| 2 | Desain UI & dashboard | `src/index.css`, `src/layouts/AppLayout.jsx`, `src/components/Mascot.jsx`, `src/components/StatCard.jsx`, `src/components/NotificationList.jsx`, `src/components/Charts.jsx`, `src/pages/DashboardPage.jsx` |
| 3 | Supabase & database | `supabase/schema.sql`, `src/lib/supabase.js` |
| 4 | Register, login, role | `src/components/AuthProvider.jsx`, `src/components/RouteGuards.jsx`, `src/pages/LoginPage.jsx`, `src/pages/RegisterPage.jsx`, `src/App.jsx` |
| 5 | Form analisis | `src/pages/NewAnalysisPage.jsx`, `shared/limits.js` |
| 6 | AI (OpenRouter/OpenAI) lewat Vercel Functions | `api/analyze.js`, `server/config.js`, `server/aiClient.js`, `server/supabaseAdmin.js`, `server/validation.js` |
| 7 | Sistem analisis Searle | `shared/searle.js`, `server/prompts.js`, `server/schemas.js`, `server/pipeline.js` |
| 8 | Hasil & visualisasi | `src/pages/AnalysisResultPage.jsx`, `src/components/UtteranceCard.jsx`, `shared/stats.js` |
| 9 | Riwayat & knowledge base | `src/pages/HistoryPage.jsx`, `src/pages/KnowledgeBasePage.jsx`, `src/pages/admin/AdminKnowledgePage.jsx`, `supabase/seed_knowledge_base.sql` |
| 10 | Export PDF & Excel | `src/services/exportService.js` |
| 11 | Testing, keamanan, deployment | `tests/`, `vercel.json`, bagian 6–9 README ini |
