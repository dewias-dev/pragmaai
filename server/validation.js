import { LIMITS } from '../shared/limits.js'

/** Menghapus karakter kontrol (kecuali baris baru & tab) dan merapikan akhir baris. */
export function cleanText(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
}

function cleanSingleLine(value) {
  return cleanText(value).replace(/\s+/g, ' ')
}

/**
 * Memvalidasi data form analisis yang dikirim dari browser.
 * Validasi di backend wajib karena data dari browser selalu bisa dimanipulasi.
 */
export function validateAnalysisInput(body) {
  const errors = {}

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, errors: { form: 'Format data tidak valid.' } }
  }

  const title = cleanSingleLine(body.title)
  const dataSource = cleanSingleLine(body.dataSource)
  const context = cleanText(body.context)
  const dialogue = cleanText(body.dialogue)

  if (title.length < LIMITS.titleMin) errors.title = `Judul minimal ${LIMITS.titleMin} karakter.`
  else if (title.length > LIMITS.titleMax) errors.title = `Judul maksimal ${LIMITS.titleMax} karakter.`

  if (dataSource.length > LIMITS.sourceMax) errors.dataSource = `Sumber data maksimal ${LIMITS.sourceMax} karakter.`
  if (context.length > LIMITS.contextMax) errors.context = `Konteks maksimal ${LIMITS.contextMax} karakter.`

  if (dialogue.length < LIMITS.dialogueMin) errors.dialogue = 'Teks dialog terlalu pendek untuk dianalisis.'
  else if (dialogue.length > LIMITS.dialogueMax) {
    errors.dialogue = `Teks dialog maksimal ${LIMITS.dialogueMax.toLocaleString('id-ID')} karakter. Bagi menjadi beberapa analisis.`
  }

  let speakers = []
  if (body.speakers !== undefined && body.speakers !== null) {
    if (!Array.isArray(body.speakers)) {
      errors.speakers = 'Daftar pembicara tidak valid.'
    } else {
      speakers = [...new Set(body.speakers.map(cleanSingleLine).filter(Boolean))]
      if (speakers.length > LIMITS.speakersMax) errors.speakers = `Maksimal ${LIMITS.speakersMax} nama pembicara.`
      else if (speakers.some((name) => name.length > LIMITS.speakerNameMax)) {
        errors.speakers = `Setiap nama pembicara maksimal ${LIMITS.speakerNameMax} karakter.`
      }
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, value: { title, dataSource, context, speakers, dialogue } }
}
