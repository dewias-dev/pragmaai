const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' })
const numberFormatter = new Intl.NumberFormat('id-ID')
const percentFormatter = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : '-')
export const formatDateTime = (value) => (value ? dateTimeFormatter.format(new Date(value)) : '-')
export const formatNumber = (value) => numberFormatter.format(value ?? 0)
export const formatPercent = (value) => `${percentFormatter.format(value ?? 0)}%`

/** "2026-11" → "Nov 26" */
export function formatMonthKey(key) {
  const [year, month] = key.split('-').map(Number)
  return monthFormatter.format(new Date(year, month - 1, 1))
}

/** Enam bulan terakhir sebagai kunci "YYYY-MM", dari yang terlama. */
export function lastMonthKeys(count = 6) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

export function initials(name, fallback = '?') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fallback
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

/** "Teori Searle & Contoh" → "teori-searle-contoh" */
export function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Nama file aman untuk unduhan. */
export function fileNameFrom(title, extension) {
  const base = slugify(title) || 'analisis'
  return `pragmaai-${base}.${extension}`
}
