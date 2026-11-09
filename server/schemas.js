/**
 * Skema JSON (Structured Outputs) yang WAJIB dipatuhi jawaban OpenAI.
 * Dengan strict: true, model tidak bisa mengembalikan format lain,
 * sehingga hasilnya bisa langsung disimpan ke database.
 */

const string = (description) => ({ type: 'string', description })
const stringArray = (description) => ({ type: 'array', items: { type: 'string' }, description })
const enumOf = (values, description) => ({ type: 'string', enum: values, description })

const strictObject = (properties) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
})

export const SEGMENTATION_SCHEMA = strictObject({
  context_sufficiency: enumOf(['memadai', 'terbatas', 'tidak_memadai'], 'Apakah konteks cukup untuk menafsirkan maksud penutur.'),
  context_note: string('Penjelasan singkat tentang kecukupan konteks dan informasi yang belum tersedia.'),
  participants: stringArray('Nama semua peserta percakapan.'),
  utterances: {
    type: 'array',
    description: 'Unit tuturan berurutan sesuai dialog.',
    items: strictObject({
      speaker: string('Nama penutur.'),
      addressee: string('Mitra tutur, atau "Tidak dapat dipastikan".'),
      text: string('Kutipan tuturan PERSIS seperti teks asli.'),
    }),
  },
})

const felicityItem = strictObject({
  status: enumOf(['terpenuhi', 'tidak_terpenuhi', 'tidak_dapat_dinilai'], 'Status syarat.'),
  explanation: string('Alasan berdasarkan data. Jika tidak dapat dinilai, mulai dengan "Informasi tidak cukup:".'),
})

const CATEGORY_ENUM = ['assertive', 'directive', 'commissive', 'expressive', 'declaration', 'undetermined']

export const UTTERANCE_ANALYSIS_SCHEMA = strictObject({
  analyses: {
    type: 'array',
    items: strictObject({
      number: { type: 'integer', description: 'Nomor tuturan yang dianalisis.' },
      category: enumOf(CATEGORY_ENUM, 'Kategori ilokusi Searle (berdasarkan ilokusi primer).'),
      specific_act: string('Nama tindak ilokusi spesifik, misalnya "meminta (requesting)".'),
      confidence: enumOf(['tinggi', 'sedang', 'rendah'], 'Kekuatan bukti untuk klasifikasi.'),
      classification_note: string('Jika undetermined/ambigu: informasi apa yang kurang. Jika tidak, string kosong.'),
      alternative_category: enumOf(
        ['assertive', 'directive', 'commissive', 'expressive', 'declaration', 'tidak_ada'],
        'Kategori lain yang juga didukung data, atau "tidak_ada".',
      ),
      illocutionary_point: string('Tujuan ilokusi.'),
      propositional_content: string('Isi proposisi (p).'),
      fp_formula: string('Formula F(p) dengan notasi Searle, atau "Tidak relevan: <alasan>".'),
      ifids: stringArray('Illocutionary Force Indicating Devices yang ada dalam tuturan/konteks.'),
      linguistic_evidence: stringArray('Kutipan bagian tuturan yang menjadi bukti.'),
      direction_of_fit: enumOf(['word_to_world', 'world_to_word', 'double', 'null_fit', 'undetermined'], 'Arah kesesuaian.'),
      psychological_state: string('Keadaan psikologis yang diungkapkan (expressed sincerity condition).'),
      felicity: strictObject({
        propositional_content: felicityItem,
        preparatory: felicityItem,
        sincerity: felicityItem,
        essential: felicityItem,
      }),
      speech_act_type: enumOf(['direct', 'indirect', 'undetermined'], 'Langsung atau tidak langsung.'),
      literal_force: string('Untuk tindak tidak langsung: ilokusi sekunder (harfiah) dan bentuk kalimatnya. Selain itu string kosong.'),
      academic_explanation: string('Penjelasan akademik dengan istilah linguistik.'),
      simple_explanation: string('Penjelasan sederhana untuk pembaca umum.'),
    }),
  },
})

export const SUMMARY_SCHEMA = strictObject({
  academic_conclusion: string('Kesimpulan akademik keseluruhan.'),
  simple_conclusion: string('Kesimpulan dalam bahasa sederhana.'),
  dominant_findings: stringArray('3–6 temuan utama/dominan dalam dialog.'),
  limitations: string('Keterbatasan analisis berdasarkan data yang tersedia.'),
})
