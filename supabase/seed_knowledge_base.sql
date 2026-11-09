-- =====================================================================
-- PragmaAI – Materi awal Knowledge Base
--
-- Jalankan SETELAH schema.sql di Supabase > SQL Editor.
-- Aman dijalankan ulang: materi dengan slug yang sudah ada tidak ditimpa,
-- sehingga perubahan yang dibuat admin di aplikasi tetap aman.
-- =====================================================================

insert into public.knowledge_base (slug, title, topic, summary, sort_order, content) values

-- ---------------------------------------------------------------------
('pengertian-pragmatik',
 'Pengertian Pragmatik',
 'Dasar',
 'Pragmatik mempelajari makna yang dimaksud penutur dalam konteks, bukan hanya makna kata dan kalimat.',
 10,
$md$
## Apa itu pragmatik?

Pragmatik adalah cabang linguistik yang mempelajari **makna tuturan dalam konteks penggunaannya**. Jika semantik bertanya "apa arti kalimat ini?", pragmatik bertanya "apa yang dimaksud penutur ketika mengucapkan kalimat ini kepada orang tertentu, di tempat dan waktu tertentu?".

Istilah ini berasal dari pembagian semiotika oleh Charles Morris (1938) menjadi sintaksis (hubungan antartanda), semantik (hubungan tanda dengan acuannya), dan pragmatik (hubungan tanda dengan penggunanya).

## Ruang lingkup

Yule (1996) merangkum pragmatik sebagai kajian tentang:

- **Makna penutur** (*speaker meaning*): apa yang dimaksud penutur, bukan sekadar arti harfiah kata-katanya.
- **Makna kontekstual**: bagaimana konteks (siapa, kepada siapa, di mana, kapan) memengaruhi makna.
- **Makna yang tersirat**: bagaimana pendengar menangkap lebih banyak daripada yang diucapkan.
- **Jarak sosial**: bagaimana kedekatan atau jarak hubungan menentukan pilihan bentuk tuturan.

Topik utama pragmatik meliputi deiksis, praanggapan (*presupposition*), implikatur, kesantunan, dan **tindak tutur** (*speech acts*), yang menjadi fokus PragmaAI.

## Contoh sederhana

Kalimat *"Sudah jam sembilan."* secara semantik hanya menyatakan waktu. Namun secara pragmatik maknanya bisa berbeda:

| Konteks | Maksud penutur |
|---|---|
| Ibu kepada anak yang masih bermain gim | Menyuruh anak segera tidur |
| Dosen kepada mahasiswa di depan kelas | Memberi tanda perkuliahan dimulai |
| Teman yang menunggu di halte | Mengeluh karena bus terlambat |

Kalimatnya sama, tetapi tindakan yang dilakukan penutur berbeda. Inilah alasan analisis tindak tutur selalu membutuhkan konteks.

## Rujukan

- Leech, G. N. (1983). *Principles of Pragmatics*. London: Longman.
- Levinson, S. C. (1983). *Pragmatics*. Cambridge: Cambridge University Press.
- Morris, C. W. (1938). *Foundations of the Theory of Signs*. Chicago: University of Chicago Press.
- Yule, G. (1996). *Pragmatics*. Oxford: Oxford University Press.
$md$),

-- ---------------------------------------------------------------------
('teori-tindak-tutur',
 'Teori Tindak Tutur',
 'Dasar',
 'Gagasan Austin bahwa berbicara adalah bertindak: lokusi, ilokusi, dan perlokusi.',
 20,
$md$
## Berbicara adalah bertindak

Teori tindak tutur berawal dari kuliah-kuliah J. L. Austin yang diterbitkan sebagai *How to Do Things with Words* (1962). Austin mengamati bahwa banyak tuturan tidak sekadar menggambarkan dunia, tetapi **melakukan sesuatu**. Mengucapkan *"Saya berjanji akan datang"* berarti melakukan tindakan berjanji, bukan melaporkan bahwa seseorang berjanji.

Austin awalnya membedakan:

- **Tuturan konstatif**: menggambarkan keadaan dan dapat dinilai benar atau salah.
- **Tuturan performatif**: melakukan tindakan; tidak benar atau salah, tetapi berhasil (*felicitous*) atau gagal (*infelicitous*).

Austin kemudian menyadari bahwa pembedaan ini tidak tegas, karena menyatakan sesuatu pun adalah sebuah tindakan.

## Tiga lapis tindakan dalam satu tuturan

| Lapis | Pengertian | Contoh: *"Anjingnya galak."* |
|---|---|---|
| **Lokusi** (*locutionary act*) | Tindakan mengucapkan kalimat bermakna dengan acuan tertentu | Mengucapkan kalimat yang bermakna bahwa anjing itu galak |
| **Ilokusi** (*illocutionary act*) | Tindakan yang dilakukan *dalam* mengucapkan tuturan | Memperingatkan mitra tutur |
| **Perlokusi** (*perlocutionary act*) | Efek yang ditimbulkan *melalui* tuturan pada mitra tutur | Mitra tutur menjadi takut dan tidak masuk pekarangan |

PragmaAI berfokus pada **lapis ilokusi**, yaitu daya atau kekuatan tuturan (*illocutionary force*): apakah penutur sedang menyatakan, meminta, berjanji, berterima kasih, atau menetapkan sesuatu.

## Perkembangan oleh Searle

John R. Searle, murid Austin, menyusun teori tindak tutur secara lebih sistematis dalam *Speech Acts* (1969) dan mengusulkan taksonomi lima kategori ilokusi dalam artikel *A Classification of Illocutionary Acts* (1976). Lihat materi **Teori Searle** dan **Lima Kategori Ilokusi**.

## Rujukan

- Austin, J. L. (1962). *How to Do Things with Words*. Oxford: Clarendon Press.
- Searle, J. R. (1969). *Speech Acts: An Essay in the Philosophy of Language*. Cambridge: Cambridge University Press.
$md$),

-- ---------------------------------------------------------------------
('teori-searle',
 'Teori Tindak Tutur Searle',
 'Teori Searle',
 'Struktur F(p), IFID, dan tiga dimensi utama yang membedakan jenis ilokusi.',
 30,
$md$
## Struktur dasar: F(p)

Searle (1969) memisahkan dua komponen dalam tindak ilokusi:

- **p** = isi proposisi (*propositional content*): apa yang dibicarakan, terdiri atas acuan (*reference*) dan predikasi (*predication*).
- **F** = daya ilokusi (*illocutionary force*): bagaimana isi itu disampaikan (sebagai pernyataan, permintaan, janji, dan seterusnya).

Contoh: *"Kamu akan menutup pintu."*, *"Tutuplah pintu!"*, dan *"Apakah kamu akan menutup pintu?"* memiliki isi proposisi yang sama (mitra tutur menutup pintu), tetapi daya ilokusinya berbeda.

## Penanda daya ilokusi (IFID)

*Illocutionary Force Indicating Devices* (IFIDs) adalah unsur bahasa yang menunjukkan daya ilokusi. Dalam bahasa Indonesia, IFID antara lain:

- **Verba performatif**: *saya berjanji*, *saya minta*, *dengan ini saya nyatakan*.
- **Modus kalimat**: deklaratif, interogatif, imperatif.
- **Partikel dan penanda kesantunan**: *tolong*, *mohon*, *-lah*, *dong*, *ya*, *kok*.
- **Intonasi dan tanda baca**: tanda tanya, tanda seru.
- **Konteks**: hubungan peserta, situasi, dan tuturan sebelumnya.

## Tiga dimensi utama (Searle, 1976)

Searle membedakan jenis ilokusi berdasarkan banyak dimensi. Tiga yang terpenting adalah:

### 1. Illocutionary point (tujuan ilokusi)
Maksud pokok tindakan. Tujuan permintaan adalah membuat mitra tutur melakukan sesuatu; tujuan janji adalah mengikat penutur pada tindakan di masa depan.

### 2. Direction of fit (arah kesesuaian)
Hubungan antara kata-kata dan dunia:

| Simbol | Arah | Penjelasan |
|---|---|---|
| ↓ | *word-to-world* | Kata-kata disesuaikan dengan dunia (asertif) |
| ↑ | *world-to-word* | Dunia diharapkan berubah agar sesuai dengan kata-kata (direktif, komisif) |
| ↕ | ganda | Tuturan itu sendiri mengubah dunia (deklaratif) |
| ∅ | tidak ada | Kebenaran isi diandaikan (ekspresif) |

### 3. Expressed psychological state (keadaan psikologis yang diungkapkan)
Sikap penutur yang terungkap lewat tuturan dan menjadi syarat ketulusan: keyakinan (B) pada asertif, keinginan (W) pada direktif, niat (I) pada komisif, dan beragam perasaan (P) pada ekspresif.

## Notasi Searle

| Kategori | Notasi |
|---|---|
| Asertif | ⊢ ↓ B (p) |
| Direktif | ! ↑ W (H does A) |
| Komisif | C ↑ I (S does A) |
| Ekspresif | E ∅ (P) (S/H + property) |
| Deklaratif | D ↕ ∅ (p) |

Keterangan: S = penutur (*speaker*), H = mitra tutur (*hearer*), A = tindakan, P = keadaan psikologis, p = proposisi.

## Rujukan

- Searle, J. R. (1969). *Speech Acts*. Cambridge: Cambridge University Press.
- Searle, J. R. (1976). A classification of illocutionary acts. *Language in Society, 5*(1), 1–23.
- Searle, J. R. (1979). *Expression and Meaning*. Cambridge: Cambridge University Press.
$md$),

-- ---------------------------------------------------------------------
('lima-kategori-ilokusi',
 'Lima Kategori Ilokusi Searle',
 'Teori Searle',
 'Definisi, ciri, tujuan komunikatif, dan indikator asertif, direktif, komisif, ekspresif, dan deklaratif.',
 40,
$md$
Searle (1976) mengelompokkan tindak ilokusi ke dalam lima kategori. Setiap kategori di bawah ini dijelaskan melalui definisi, ciri, tujuan komunikatif, dan indikatornya.

## 1. Asertif / Representatif (*Assertives*)

- **Definisi**: mengikat penutur pada kebenaran proposisi yang diungkapkan.
- **Ciri**: dapat dinilai benar atau salah; arah kesesuaian kata ke dunia (↓); keadaan psikologis berupa keyakinan.
- **Tujuan komunikatif**: menggambarkan keadaan dunia sebagaimana diyakini penutur.
- **Indikator**: menyatakan, melaporkan, menjelaskan, menyimpulkan, mengakui, mengeluhkan, membanggakan.
- **Contoh**: *"Rapatnya ditunda sampai Kamis."*

## 2. Direktif (*Directives*)

- **Definisi**: upaya penutur agar mitra tutur melakukan sesuatu.
- **Ciri**: isi proposisi berupa tindakan mitra tutur di masa depan; arah dunia ke kata (↑); keadaan psikologis berupa keinginan.
- **Tujuan komunikatif**: membuat mitra tutur bertindak.
- **Indikator**: meminta, memerintah, menyarankan, mengajak, memohon, melarang, **bertanya** (pertanyaan adalah upaya meminta informasi).
- **Contoh**: *"Tolong kirim laporannya sore ini."*

## 3. Komisif (*Commissives*)

- **Definisi**: mengikat penutur untuk melakukan tindakan di masa depan.
- **Ciri**: isi proposisi berupa tindakan penutur sendiri; arah dunia ke kata (↑); keadaan psikologis berupa niat.
- **Tujuan komunikatif**: mengikatkan diri pada suatu kewajiban.
- **Indikator**: berjanji, bersumpah, menawarkan, menyanggupi, mengancam.
- **Contoh**: *"Besok saya jemput kamu di stasiun."*

## 4. Ekspresif (*Expressives*)

- **Definisi**: mengungkapkan keadaan psikologis penutur terhadap keadaan yang disebut dalam isi proposisi.
- **Ciri**: kebenaran isi diandaikan, bukan ditegaskan; tidak ada arah kesesuaian (∅).
- **Tujuan komunikatif**: menyampaikan sikap atau perasaan kepada mitra tutur.
- **Indikator**: berterima kasih, meminta maaf, mengucapkan selamat, menyambut, memuji, berbelasungkawa.
- **Contoh**: *"Maaf, saya terlambat."*

## 5. Deklaratif (*Declarations*)

- **Definisi**: bila berhasil dilakukan, tuturan langsung mengubah keadaan dunia sesuai isi proposisinya.
- **Ciri**: memerlukan lembaga di luar bahasa dan penutur yang berwenang; arah ganda (↕); tanpa syarat ketulusan.
- **Tujuan komunikatif**: menciptakan atau mengubah status secara institusional.
- **Indikator**: menyatakan sah, mengangkat, memecat, membaptis, menjatuhkan vonis, membuka/menutup sidang.
- **Contoh**: *"Dengan ini rapat saya nyatakan dibuka."* (diucapkan oleh pimpinan rapat).

## Ringkasan perbandingan

| Kategori | Tujuan ilokusi | Arah | Keadaan psikologis |
|---|---|---|---|
| Asertif | Menyatakan kebenaran p | ↓ | Keyakinan |
| Direktif | Membuat H melakukan A | ↑ | Keinginan |
| Komisif | Mengikat S melakukan A | ↑ | Niat |
| Ekspresif | Mengungkapkan sikap | ∅ | Bervariasi |
| Deklaratif | Mengubah keadaan lewat tuturan | ↕ | Tidak ada |

## Hal yang perlu diwaspadai

- **Kategori ditentukan oleh fungsi, bukan bentuk kalimat.** *"Bisa ambilkan garam?"* berbentuk pertanyaan tetapi berfungsi sebagai permintaan (direktif tidak langsung).
- **Deklaratif butuh kewenangan.** Kalimat *"Kamu saya pecat!"* yang diucapkan teman sebaya sebagai candaan tidak mengubah status siapa pun.
- **Konteks bisa kurang.** Jika data tidak cukup untuk menentukan maksud penutur, klasifikasi sebaiknya dinyatakan belum dapat dipastikan.

## Rujukan

- Searle, J. R. (1976). A classification of illocutionary acts. *Language in Society, 5*(1), 1–23.
- Searle, J. R., & Vanderveken, D. (1985). *Foundations of Illocutionary Logic*. Cambridge: Cambridge University Press.
$md$),

-- ---------------------------------------------------------------------
('felicity-conditions',
 'Felicity Conditions',
 'Teori Searle',
 'Empat syarat keberhasilan tindak tutur: isi proposisi, persiapan, ketulusan, dan esensial.',
 50,
$md$
## Syarat keberhasilan tindak tutur

Austin menyebut tindak tutur dapat berhasil (*felicitous*) atau gagal (*infelicitous*). Searle (1969) merumuskan syarat-syarat itu menjadi empat jenis aturan konstitutif:

| Syarat | Pertanyaan kunci |
|---|---|
| **Propositional content condition** | Isi proposisi seperti apa yang cocok untuk tindakan ini? |
| **Preparatory condition** | Keadaan apa yang harus sudah ada sebelum tindakan masuk akal dilakukan? |
| **Sincerity condition** | Keadaan psikologis apa yang diungkapkan penutur? |
| **Essential condition** | Tuturan ini dianggap sebagai tindakan apa? |

## Contoh: meminta (*request*)

| Syarat | Isi |
|---|---|
| Isi proposisi | Tindakan A di masa depan oleh mitra tutur |
| Persiapan | Mitra tutur mampu melakukan A, penutur meyakini hal itu, dan tidak jelas bahwa mitra tutur akan melakukan A tanpa diminta |
| Ketulusan | Penutur menginginkan mitra tutur melakukan A |
| Esensial | Dianggap sebagai upaya membuat mitra tutur melakukan A |

## Contoh: berjanji (*promise*)

| Syarat | Isi |
|---|---|
| Isi proposisi | Tindakan A di masa depan oleh penutur |
| Persiapan | Mitra tutur lebih suka penutur melakukan A, dan tidak jelas bahwa penutur akan melakukan A dalam keadaan biasa |
| Ketulusan | Penutur berniat melakukan A |
| Esensial | Dianggap sebagai kewajiban penutur untuk melakukan A |

## Contoh: menyatakan (*assert*)

| Syarat | Isi |
|---|---|
| Isi proposisi | Proposisi apa saja (p) |
| Persiapan | Penutur memiliki alasan atas kebenaran p, dan tidak jelas bahwa mitra tutur sudah mengetahui p |
| Ketulusan | Penutur meyakini p |
| Esensial | Dianggap sebagai jaminan bahwa p menggambarkan keadaan sebenarnya |

## Contoh: berterima kasih (*thank*)

| Syarat | Isi |
|---|---|
| Isi proposisi | Tindakan A di masa lalu oleh mitra tutur |
| Persiapan | A menguntungkan penutur, dan penutur meyakininya |
| Ketulusan | Penutur merasa berterima kasih atas A |
| Esensial | Dianggap sebagai ungkapan terima kasih |

## Menilai syarat dari data

Dalam analisis data nyata, tidak semua syarat dapat dinilai. Syarat ketulusan, misalnya, berkaitan dengan keadaan batin penutur yang sering tidak terlihat dari teks. Karena itu PragmaAI memakai tiga status:

- **Terpenuhi**: ada bukti dalam dialog atau konteks.
- **Tidak terpenuhi**: ada bukti bahwa syarat dilanggar (misalnya penutur tidak berwenang membuat deklarasi).
- **Informasi tidak cukup**: data tidak memungkinkan penilaian. Status ini lebih jujur daripada menebak.

## Rujukan

- Austin, J. L. (1962). *How to Do Things with Words*. Oxford: Clarendon Press.
- Searle, J. R. (1969). *Speech Acts*. Cambridge: Cambridge University Press, khususnya bab 3.
$md$),

-- ---------------------------------------------------------------------
('tindak-tutur-langsung-tidak-langsung',
 'Tindak Tutur Langsung dan Tidak Langsung',
 'Teori Searle',
 'Ketika bentuk kalimat tidak sama dengan fungsinya: ilokusi primer dan sekunder.',
 60,
$md$
## Langsung dan tidak langsung

Yule (1996) menjelaskan bahwa terdapat hubungan yang lazim antara **bentuk kalimat** dan **fungsi umumnya**:

| Bentuk | Fungsi lazim |
|---|---|
| Deklaratif | Pernyataan |
| Interogatif | Pertanyaan |
| Imperatif | Perintah atau permintaan |

- **Tindak tutur langsung** (*direct speech act*): bentuk dan fungsinya sejalan. *"Tutup pintunya."* (imperatif → perintah).
- **Tindak tutur tidak langsung** (*indirect speech act*): bentuk dan fungsinya tidak sejalan. *"Dingin sekali di sini, ya."* (deklaratif → permintaan menutup jendela).

## Ilokusi primer dan sekunder

Searle (1975) menjelaskan bahwa dalam tindak tutur tidak langsung, penutur melakukan satu tindak ilokusi **melalui** tindak ilokusi lain:

- **Ilokusi sekunder** (harfiah): tindakan sesuai bentuk kalimat. Pada *"Bisa ambilkan garam?"* ilokusi sekundernya adalah menanyakan kemampuan.
- **Ilokusi primer** (yang dimaksud): tindakan yang sebenarnya dikehendaki. Pada contoh tadi, ilokusi primernya adalah meminta garam.

Mitra tutur memahami ilokusi primer melalui informasi latar bersama, prinsip kerja sama percakapan, dan kemampuan menarik kesimpulan.

## Mengapa penting dalam analisis?

- **Kategori ditentukan oleh ilokusi primer.** *"Bisa ambilkan garam?"* diklasifikasikan sebagai direktif, bukan pertanyaan biasa.
- **Ketidaklangsungan sering berkaitan dengan kesantunan.** Permintaan tidak langsung terdengar lebih halus.
- **Konteks sangat menentukan.** Tanpa konteks, *"Panas sekali, ya."* bisa jadi hanya keluhan (asertif/ekspresif), bukan permintaan.

## Rujukan

- Searle, J. R. (1975). Indirect speech acts. Dalam P. Cole & J. L. Morgan (Eds.), *Syntax and Semantics 3: Speech Acts* (hlm. 59–82). New York: Academic Press.
- Yule, G. (1996). *Pragmatics*. Oxford: Oxford University Press.
$md$),

-- ---------------------------------------------------------------------
('contoh-analisis',
 'Contoh Analisis Dialog',
 'Praktik',
 'Contoh langkah demi langkah menganalisis dialog singkat dengan kerangka Searle.',
 70,
$md$
## Data

**Konteks**: Rina dan Dimas adalah mahasiswa satu kelompok tugas. Mereka bertemu di perpustakaan sehari sebelum batas pengumpulan makalah.

> (1) **Rina**: Makalah kita belum ada daftar pustakanya.
> (2) **Dimas**: Wah, maaf banget, aku lupa.
> (3) **Rina**: Bisa kamu kerjakan malam ini?
> (4) **Dimas**: Oke, nanti malam aku selesaikan.
> (5) **Rina**: Makasih, ya.

## Analisis

| No. | Penutur | Kategori | Tindak ilokusi | Langsung? |
|---|---|---|---|---|
| 1 | Rina | Asertif (mungkin juga direktif tidak langsung) | Memberitahukan | Langsung sebagai pernyataan |
| 2 | Dimas | Ekspresif | Meminta maaf | Langsung |
| 3 | Rina | Direktif | Meminta | Tidak langsung |
| 4 | Dimas | Komisif | Menyanggupi/berjanji | Langsung |
| 5 | Rina | Ekspresif | Berterima kasih | Langsung |

### Tuturan (3): *"Bisa kamu kerjakan malam ini?"*

- **Illocutionary point**: membuat Dimas mengerjakan daftar pustaka.
- **Propositional content**: Dimas mengerjakan daftar pustaka malam ini (tindakan H di masa depan).
- **F(p)**: ! ↑ W (Dimas mengerjakan daftar pustaka malam ini).
- **IFID**: bentuk interogatif tentang kemampuan (*bisa*), sapaan langsung *kamu*, keterangan waktu *malam ini*.
- **Direction of fit**: dunia ke kata (↑).
- **Psychological state**: keinginan Rina agar Dimas mengerjakannya.
- **Felicity conditions**:
  - Isi proposisi: terpenuhi, karena berupa tindakan Dimas di masa depan.
  - Persiapan: terpenuhi; Dimas anggota kelompok dan tugas belum selesai.
  - Ketulusan: informasi tidak cukup untuk memastikan keadaan batin Rina, tetapi tuturan mengungkapkan keinginan.
  - Esensial: terpenuhi; tuturan dipahami Dimas sebagai permintaan, terlihat dari jawabannya di tuturan (4).
- **Langsung/tidak langsung**: tidak langsung. Bentuknya pertanyaan tentang kemampuan (ilokusi sekunder), fungsinya permintaan (ilokusi primer).

### Catatan untuk tuturan (1)

Tuturan (1) secara langsung adalah asertif. Dalam konteks ini, tuturan itu juga dapat dibaca sebagai direktif tidak langsung (meminta Dimas mengurus daftar pustaka). Karena data mendukung kedua tafsiran, analisis yang baik menyebutkan **kategori alternatif** beserta alasannya, bukan memaksakan satu jawaban.

## Kesimpulan contoh

Dialog didominasi tindak ekspresif dan menunjukkan pola permintaan yang santun: Rina memilih bentuk tidak langsung (pertanyaan kemampuan) dan menutup dengan ucapan terima kasih, sementara Dimas merespons dengan permintaan maaf dan komitmen.
$md$),

-- ---------------------------------------------------------------------
('panduan-membaca-hasil',
 'Panduan Membaca Hasil PragmaAI',
 'Praktik',
 'Arti setiap kolom hasil analisis dan cara memakainya secara bertanggung jawab dalam penelitian.',
 80,
$md$
## Arti kolom hasil analisis

| Kolom | Arti |
|---|---|
| **Kategori ilokusi** | Salah satu dari lima kategori Searle, atau *Belum dapat dipastikan* bila konteks tidak cukup |
| **Tindak ilokusi spesifik** | Nama tindakannya, misalnya meminta, berjanji, berterima kasih |
| **Tingkat keyakinan** | Seberapa kuat bukti dalam data mendukung klasifikasi |
| **Kategori alternatif** | Tafsiran lain yang juga mungkin berdasarkan data |
| **Illocutionary point** | Tujuan pokok tindakan |
| **Propositional content** | Isi proposisi yang dibicarakan |
| **F(p)** | Formula daya ilokusi dan isi proposisi dengan notasi Searle |
| **IFIDs** | Penanda kebahasaan yang menunjukkan daya ilokusi |
| **Bukti linguistik** | Kutipan bagian tuturan yang mendukung klasifikasi |
| **Direction of fit** | Arah kesesuaian kata dan dunia |
| **Psychological state** | Keadaan psikologis yang diungkapkan (syarat ketulusan) |
| **Felicity conditions** | Penilaian empat syarat keberhasilan |
| **Langsung/tidak langsung** | Kesesuaian bentuk kalimat dengan fungsinya |

## Penanda kutipan

Jika sebuah tuturan diberi tanda **"kutipan perlu dicek"**, berarti teks tuturan hasil pemenggalan AI tidak ditemukan persis sama di teks asli (misalnya karena spasi atau tanda baca berubah). Bandingkan dengan transkrip asli sebelum mengutipnya dalam karya ilmiah.

## Menggunakan hasil AI secara bertanggung jawab

- **Hasil AI adalah analisis awal**, bukan keputusan akhir. Peneliti tetap bertanggung jawab memverifikasi setiap klasifikasi.
- **Lengkapi konteks.** Semakin jelas konteks (hubungan peserta, situasi, peristiwa sebelumnya), semakin akurat analisisnya.
- **Perhatikan status "Informasi tidak cukup".** Status ini menandai bagian yang memerlukan data tambahan atau penilaian peneliti.
- **Laporkan kekeliruan.** Gunakan tombol umpan balik pada hasil analisis agar admin dapat mengevaluasi kualitas sistem.
- **Cantumkan penggunaan alat bantu AI** dalam metodologi penelitian sesuai aturan institusi Anda.
$md$)

on conflict (slug) do nothing;
