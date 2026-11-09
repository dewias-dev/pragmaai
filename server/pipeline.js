import { LIMITS } from '../shared/limits.js'
import { CATEGORY_KEYS } from '../shared/searle.js'
import { computeDistribution } from '../shared/stats.js'
import { HttpError } from './http.js'
import { callStructured } from './aiClient.js'
import {
  ANALYSIS_INSTRUCTIONS,
  SEGMENTATION_INSTRUCTIONS,
  SUMMARY_INSTRUCTIONS,
  buildAnalysisInput,
  buildSegmentationInput,
  buildSummaryInput,
} from './prompts.js'
import { SEGMENTATION_SCHEMA, SUMMARY_SCHEMA, UTTERANCE_ANALYSIS_SCHEMA } from './schemas.js'
import { isVerbatimQuote } from './verbatim.js'

const FELICITY_KEYS = ['propositional_content', 'preparatory', 'sincerity', 'essential']
const FELICITY_STATUSES = ['terpenuhi', 'tidak_terpenuhi', 'tidak_dapat_dinilai']

const clip = (value, max = 4000) => String(value ?? '').trim().slice(0, max)
const clipList = (list, maxItems = 12, maxLength = 300) =>
  (Array.isArray(list) ? list : []).map((item) => clip(item, maxLength)).filter(Boolean).slice(0, maxItems)

function chunk(list, size) {
  const result = []
  for (let i = 0; i < list.length; i += size) result.push(list.slice(i, i + size))
  return result
}

/** Menjalankan fungsi async untuk setiap item dengan batas jumlah yang berjalan bersamaan. */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/** Merapikan hasil felicity dari AI agar selalu lengkap empat syarat. */
function normalizeFelicity(felicity) {
  felicity = felicity && typeof felicity === 'object' ? felicity : {}
  const result = {}
  for (const key of FELICITY_KEYS) {
    const item = felicity?.[key]
    const status = FELICITY_STATUSES.includes(item?.status) ? item.status : 'tidak_dapat_dinilai'
    const explanation = clip(item?.explanation, 1500) || 'Informasi tidak cukup: AI tidak memberikan penilaian untuk syarat ini.'
    result[key] = { status, explanation }
  }
  return result
}

/** Hasil cadangan bila AI tidak mengembalikan analisis untuk sebuah tuturan. */
function fallbackAnalysis(number) {
  const note = 'Informasi tidak cukup: AI tidak mengembalikan analisis untuk tuturan ini.'
  return {
    number,
    category: 'undetermined',
    specific_act: 'Belum dapat dipastikan',
    confidence: 'rendah',
    classification_note: 'AI tidak mengembalikan analisis untuk tuturan ini. Jalankan ulang analisis atau periksa secara manual.',
    alternative_category: 'tidak_ada',
    illocutionary_point: 'Belum dapat dipastikan.',
    propositional_content: 'Belum dapat dipastikan.',
    fp_formula: 'Tidak relevan: kategori belum dapat dipastikan.',
    ifids: [],
    linguistic_evidence: [],
    direction_of_fit: 'undetermined',
    psychological_state: 'Belum dapat dipastikan.',
    felicity: Object.fromEntries(FELICITY_KEYS.map((key) => [key, { status: 'tidak_dapat_dinilai', explanation: note }])),
    speech_act_type: 'undetermined',
    literal_force: '',
    academic_explanation: 'Analisis tidak tersedia untuk tuturan ini.',
    simple_explanation: 'Analisis untuk tuturan ini belum tersedia.',
  }
}

function normalizeAnalysis(raw) {
  raw = raw && typeof raw === 'object' ? raw : {}
  const category = [...CATEGORY_KEYS, 'undetermined'].includes(raw.category) ? raw.category : 'undetermined'
  return {
    category,
    specific_act: clip(raw.specific_act, 200),
    confidence: ['tinggi', 'sedang', 'rendah'].includes(raw.confidence) ? raw.confidence : 'sedang',
    classification_note: clip(raw.classification_note, 1500),
    alternative_category:
      CATEGORY_KEYS.includes(raw.alternative_category) && raw.alternative_category !== category ? raw.alternative_category : 'tidak_ada',
    illocutionary_point: clip(raw.illocutionary_point, 1500),
    propositional_content: clip(raw.propositional_content, 1500),
    fp_formula: clip(raw.fp_formula, 500),
    ifids: clipList(raw.ifids),
    linguistic_evidence: clipList(raw.linguistic_evidence),
    direction_of_fit: ['word_to_world', 'world_to_word', 'double', 'null_fit', 'undetermined'].includes(raw.direction_of_fit)
      ? raw.direction_of_fit
      : 'undetermined',
    psychological_state: clip(raw.psychological_state, 1000),
    felicity: normalizeFelicity(raw.felicity),
    speech_act_type: ['direct', 'indirect', 'undetermined'].includes(raw.speech_act_type) ? raw.speech_act_type : 'undetermined',
    literal_force: clip(raw.literal_force, 1000),
    academic_explanation: clip(raw.academic_explanation, 4000),
    simple_explanation: clip(raw.simple_explanation, 2000),
  }
}

/**
 * Alur analisis lengkap:
 *  1. Segmentasi: AI membaca dialog dan memecahnya menjadi unit tuturan.
 *  2. Klasifikasi: setiap kelompok tuturan dianalisis dengan kerangka Searle (paralel).
 *  3. Statistik: dihitung oleh kode (bukan AI) dari hasil klasifikasi.
 *  4. Kesimpulan: AI menyusun kesimpulan berdasarkan statistik tersebut.
 */
export async function runSpeechActAnalysis(ai, config, input, { signal, log = () => {} } = {}) {
  const batchSize = config.batchSize ?? 8
  const concurrency = config.concurrency ?? 6
  const maxUtterances = Math.min(config.maxUtterances ?? LIMITS.maxUtterances, LIMITS.maxUtterances)

  // ---------- 1. Segmentasi ----------
  log('segmentasi dimulai')
  const segmentation = await callStructured(ai, config, {
    name: 'segmentasi_tuturan',
    instructions: SEGMENTATION_INSTRUCTIONS,
    input: buildSegmentationInput(input),
    schema: SEGMENTATION_SCHEMA,
    maxOutputTokens: 32000,
    signal,
    validate: (data) =>
      Array.isArray(data.utterances) && data.utterances.some((u) => typeof u?.text === 'string' && u.text.trim())
        ? null
        : 'daftar "utterances" kosong atau tidak ada',
  })

  const segments = (segmentation.utterances || [])
    .map((u) => ({
      speaker: clip(u.speaker, 120) || 'Tidak diketahui',
      addressee: clip(u.addressee, 200) || 'Tidak dapat dipastikan',
      text: clip(u.text, 4000),
    }))
    .filter((u) => u.text.length > 0)
    .map((u, index) => ({ ...u, number: index + 1 }))

  if (segments.length === 0) {
    throw new HttpError(422, 'Tidak ditemukan tuturan yang dapat dianalisis. Pastikan teks berisi dialog atau percakapan.')
  }
  if (segments.length > maxUtterances) {
    throw new HttpError(
      422,
      `Dialog berisi ${segments.length} unit tuturan, melebihi batas ${maxUtterances} untuk model ${config.aiModel}. Bagi dialog menjadi beberapa analisis.`,
    )
  }

  const shared = {
    ...input,
    participants: clipList(segmentation.participants, 30, 120),
    contextNote: clip(segmentation.context_note, 1500),
  }
  log(`segmentasi selesai: ${segments.length} tuturan`)

  // ---------- 2. Klasifikasi per kelompok ----------
  async function analyzeBatch(batch) {
    const result = await callStructured(ai, config, {
      name: 'analisis_tindak_tutur',
      instructions: ANALYSIS_INSTRUCTIONS,
      input: buildAnalysisInput(shared, batch),
      schema: UTTERANCE_ANALYSIS_SCHEMA,
      maxOutputTokens: 24000,
      signal,
      validate: (data) => (Array.isArray(data.analyses) && data.analyses.length > 0 ? null : 'daftar "analyses" kosong atau tidak ada'),
    })
    const wanted = new Set(batch.map((u) => u.number))
    const found = new Map()
    for (const item of Array.isArray(result.analyses) ? result.analyses : []) {
      const number = Number(item?.number)
      if (wanted.has(number) && !found.has(number)) found.set(number, item)
    }
    return found
  }

  const analysesByNumber = new Map()
  const batchResults = await mapWithConcurrency(chunk(segments, batchSize), concurrency, analyzeBatch)
  for (const found of batchResults) for (const [number, item] of found) analysesByNumber.set(number, item)

  // Satu kali percobaan ulang untuk tuturan yang terlewat.
  const missing = segments.filter((u) => !analysesByNumber.has(u.number))
  if (missing.length > 0) {
    log(`mengulang ${missing.length} tuturan yang terlewat`)
    const retried = await mapWithConcurrency(chunk(missing, batchSize), concurrency, analyzeBatch)
    for (const found of retried) for (const [number, item] of found) analysesByNumber.set(number, item)
  }

  const utterances = segments.map((segment) => ({
    ...segment,
    quote_verified: isVerbatimQuote(segment.text, input.dialogue),
    ...normalizeAnalysis(analysesByNumber.get(segment.number) ?? fallbackAnalysis(segment.number)),
  }))
  log('klasifikasi selesai')

  // ---------- 3. Statistik (dihitung kode) ----------
  const stats = computeDistribution(utterances)

  // ---------- 4. Kesimpulan ----------
  const summary = await callStructured(ai, config, {
    name: 'kesimpulan_analisis',
    instructions: SUMMARY_INSTRUCTIONS,
    input: buildSummaryInput(shared, utterances, stats),
    schema: SUMMARY_SCHEMA,
    maxOutputTokens: 12000,
    signal,
    validate: (data) => (typeof data.academic_conclusion === 'string' && data.academic_conclusion.trim() ? null : 'kesimpulan akademik kosong'),
  })
  log('kesimpulan selesai')

  return {
    contextSufficiency: ['memadai', 'terbatas', 'tidak_memadai'].includes(segmentation.context_sufficiency)
      ? segmentation.context_sufficiency
      : 'terbatas',
    contextNote: shared.contextNote,
    utterances,
    stats,
    summary: {
      academic_conclusion: clip(summary.academic_conclusion, 8000),
      simple_conclusion: clip(summary.simple_conclusion, 3000),
      dominant_findings: clipList(summary.dominant_findings, 8, 600),
      limitations: clip(summary.limitations, 3000),
    },
  }
}
