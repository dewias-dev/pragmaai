/**
 * Data teori Searle yang dipakai bersama oleh frontend (tampilan) dan backend (prompt AI).
 * Mengubah definisi di sini akan mengubah keduanya sekaligus.
 *
 * Rujukan utama:
 * - Searle, J. R. (1969). Speech Acts. Cambridge University Press.
 * - Searle, J. R. (1976). A classification of illocutionary acts. Language in Society, 5(1), 1–23.
 * - Searle, J. R. (1979). Expression and Meaning. Cambridge University Press.
 */

/** Lima kategori utama Searle (urutan tetap, dipakai di tabel dan grafik). */
export const CATEGORY_KEYS = ['assertive', 'directive', 'commissive', 'expressive', 'declaration']

/** Lima kategori + kategori "belum dapat dipastikan". */
export const ALL_CATEGORY_KEYS = [...CATEGORY_KEYS, 'undetermined']

export const CATEGORIES = {
  assertive: {
    key: 'assertive',
    label: 'Asertif',
    english: 'Assertives / Representatives',
    notation: '⊢ ↓ B (p)',
    symbol: '⊢',
    fit: '↓',
    color: '#2f5bd3',
    definition:
      'Tindak tutur yang mengikat penutur pada kebenaran proposisi yang diungkapkan; tuturannya dapat dinilai benar atau salah.',
    features: [
      'Dapat diuji benar atau salahnya',
      'Penutur mempertanggungjawabkan kebenaran isi tuturan',
      'Arah kesesuaian kata ke dunia (word-to-world)',
    ],
    purpose: 'Menggambarkan keadaan dunia sebagaimana diyakini penutur.',
    psychologicalState: 'Keyakinan (belief) bahwa p',
    indicators: ['menyatakan', 'melaporkan', 'menjelaskan', 'menyimpulkan', 'mengakui', 'membanggakan', 'mengeluhkan'],
  },
  directive: {
    key: 'directive',
    label: 'Direktif',
    english: 'Directives',
    notation: '! ↑ W (H does A)',
    symbol: '!',
    fit: '↑',
    color: '#00937d',
    definition: 'Tindak tutur yang merupakan upaya penutur agar mitra tutur melakukan sesuatu.',
    features: [
      'Isi proposisi berupa tindakan mitra tutur di masa depan',
      'Kekuatannya beragam, dari menyarankan sampai memerintah',
      'Arah kesesuaian dunia ke kata (world-to-word)',
    ],
    purpose: 'Membuat mitra tutur bertindak sesuai isi tuturan.',
    psychologicalState: 'Keinginan (want/wish) agar mitra tutur melakukan A',
    indicators: ['meminta', 'memerintah', 'menyarankan', 'bertanya', 'mengajak', 'memohon', 'menantang', 'melarang'],
  },
  commissive: {
    key: 'commissive',
    label: 'Komisif',
    english: 'Commissives',
    notation: 'C ↑ I (S does A)',
    symbol: 'C',
    fit: '↑',
    color: '#6a4bc4',
    definition: 'Tindak tutur yang mengikat penutur untuk melakukan suatu tindakan di masa depan.',
    features: [
      'Isi proposisi berupa tindakan penutur sendiri di masa depan',
      'Menciptakan kewajiban bagi penutur',
      'Arah kesesuaian dunia ke kata (world-to-word)',
    ],
    purpose: 'Mengikatkan diri penutur pada tindakan yang akan datang.',
    psychologicalState: 'Niat (intention) untuk melakukan A',
    indicators: ['berjanji', 'bersumpah', 'menawarkan', 'mengancam', 'menyanggupi', 'bertekad'],
  },
  expressive: {
    key: 'expressive',
    label: 'Ekspresif',
    english: 'Expressives',
    notation: 'E ∅ (P) (S/H + property)',
    symbol: 'E',
    fit: '∅',
    color: '#b7791f',
    definition:
      'Tindak tutur yang mengungkapkan keadaan psikologis penutur terhadap suatu keadaan yang dinyatakan dalam isi proposisi.',
    features: [
      'Kebenaran isi proposisi diandaikan (presupposed), bukan ditegaskan',
      'Berpusat pada sikap atau perasaan penutur',
      'Tidak memiliki arah kesesuaian (∅)',
    ],
    purpose: 'Menyampaikan sikap atau perasaan penutur kepada mitra tutur.',
    psychologicalState: 'Bervariasi: terima kasih, penyesalan, senang, simpati, dan sebagainya',
    indicators: ['berterima kasih', 'meminta maaf', 'mengucapkan selamat', 'menyambut', 'menyesalkan', 'memuji', 'berbelasungkawa'],
  },
  declaration: {
    key: 'declaration',
    label: 'Deklaratif',
    english: 'Declarations',
    notation: 'D ↕ ∅ (p)',
    symbol: 'D',
    fit: '↕',
    color: '#b8324a',
    definition:
      'Tindak tutur yang, bila berhasil dilakukan, langsung mengubah keadaan dunia sehingga sesuai dengan isi proposisinya.',
    features: [
      'Menuntut lembaga atau kewenangan di luar bahasa (pengadilan, rapat, agama, organisasi)',
      'Penutur harus berada pada posisi yang berwenang',
      'Arah kesesuaian ganda (↕), tanpa syarat ketulusan',
    ],
    purpose: 'Menciptakan atau mengubah status/keadaan secara institusional melalui tuturan.',
    psychologicalState: 'Tidak ada syarat ketulusan (∅)',
    indicators: ['menyatakan sah', 'membaptis', 'memecat', 'mengangkat', 'menjatuhkan vonis', 'membuka/menutup sidang'],
  },
  undetermined: {
    key: 'undetermined',
    label: 'Belum dapat dipastikan',
    english: 'Undetermined',
    notation: '?',
    symbol: '?',
    fit: '?',
    color: '#8590a6',
    definition: 'Konteks dalam data tidak cukup untuk menentukan kategori ilokusi secara meyakinkan.',
    features: [],
    purpose: '',
    psychologicalState: '',
    indicators: [],
  },
}

export const DIRECTION_OF_FIT = {
  word_to_world: { label: 'Kata ke dunia (word-to-world)', symbol: '↓' },
  world_to_word: { label: 'Dunia ke kata (world-to-word)', symbol: '↑' },
  double: { label: 'Ganda (double direction)', symbol: '↕' },
  null_fit: { label: 'Tanpa arah kesesuaian (null)', symbol: '∅' },
  undetermined: { label: 'Belum dapat dipastikan', symbol: '?' },
}

export const FELICITY_KEYS = [
  { key: 'propositional_content', label: 'Propositional Content Condition', short: 'Isi proposisi' },
  { key: 'preparatory', label: 'Preparatory Condition', short: 'Persiapan' },
  { key: 'sincerity', label: 'Sincerity Condition', short: 'Ketulusan' },
  { key: 'essential', label: 'Essential Condition', short: 'Esensial' },
]

export const FELICITY_STATUS = {
  terpenuhi: { label: 'Terpenuhi', tone: 'success' },
  tidak_terpenuhi: { label: 'Tidak terpenuhi', tone: 'danger' },
  tidak_dapat_dinilai: { label: 'Informasi tidak cukup', tone: 'muted' },
}

export const SPEECH_ACT_TYPES = {
  direct: { label: 'Langsung', english: 'Direct speech act' },
  indirect: { label: 'Tidak langsung', english: 'Indirect speech act' },
  undetermined: { label: 'Belum dapat dipastikan', english: 'Undetermined' },
}

export const CONFIDENCE_LEVELS = {
  tinggi: { label: 'Tinggi' },
  sedang: { label: 'Sedang' },
  rendah: { label: 'Rendah' },
}

export const CONTEXT_SUFFICIENCY = {
  memadai: { label: 'Konteks memadai' },
  terbatas: { label: 'Konteks terbatas' },
  tidak_memadai: { label: 'Konteks tidak memadai' },
}

export function categoryLabel(key) {
  return CATEGORIES[key]?.label ?? 'Tidak dikenal'
}
