/**
 * Menyamakan variasi penulisan yang tidak mengubah isi (spasi, jenis tanda kutip,
 * tanda pisah, elipsis) agar kutipan bisa dibandingkan dengan teks asli.
 */
export function normalizeForComparison(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** True bila kutipan tuturan benar-benar ada di teks dialog asli. */
export function isVerbatimQuote(quote, sourceText) {
  const normalizedQuote = normalizeForComparison(quote)
  if (!normalizedQuote) return false
  return normalizeForComparison(sourceText).includes(normalizedQuote)
}
