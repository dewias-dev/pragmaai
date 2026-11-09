import { ALL_CATEGORY_KEYS, CATEGORY_KEYS } from './searle.js'

/**
 * Persentase dengan 1 angka desimal (pembulatan biasa), misalnya 9 dari 27 = 33,3%.
 * Karena pembulatan, jumlah semua persentase bisa 99,9% atau 100,1%.
 */
export function percentOf(count, total) {
  if (!total) return 0
  return Math.round((count / total) * 1000) / 10
}

/**
 * Menghitung distribusi kategori dari daftar tuturan hasil analisis.
 * Semua angka berasal dari data tuturan yang sebenarnya, bukan dari teks AI.
 */
export function computeDistribution(utterances = []) {
  const counts = Object.fromEntries(ALL_CATEGORY_KEYS.map((key) => [key, 0]))
  const speechActTypes = { direct: 0, indirect: 0, undetermined: 0 }

  for (const utterance of utterances) {
    const category = ALL_CATEGORY_KEYS.includes(utterance.category) ? utterance.category : 'undetermined'
    counts[category] += 1
    const type = utterance.speech_act_type in speechActTypes ? utterance.speech_act_type : 'undetermined'
    speechActTypes[type] += 1
  }

  const total = utterances.length
  const rows = ALL_CATEGORY_KEYS.map((key) => ({ key, count: counts[key], percentage: percentOf(counts[key], total) }))

  const highest = Math.max(0, ...CATEGORY_KEYS.map((key) => counts[key]))
  const dominant = highest > 0 ? CATEGORY_KEYS.filter((key) => counts[key] === highest) : []

  return {
    total,
    counts,
    rows,
    dominant,
    speechActTypes,
    speechActTypePercentages: {
      direct: percentOf(speechActTypes.direct, total),
      indirect: percentOf(speechActTypes.indirect, total),
      undetermined: percentOf(speechActTypes.undetermined, total),
    },
  }
}
