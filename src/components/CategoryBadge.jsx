import { CATEGORIES } from '../../shared/searle.js'
import { categoryStyle } from '../utils/categoryStyle.js'

/**
 * Label kategori dengan notasi Searle singkat, misalnya "! ↑ Direktif".
 * Simbol pertama = penanda daya ilokusi, simbol kedua = arah kesesuaian.
 */
export function CategoryBadge({ category, showGlyph = true }) {
  const c = CATEGORIES[category] ?? CATEGORIES.undetermined
  const glyph = category === 'undetermined' || !CATEGORIES[category] ? '?' : `${c.symbol} ${c.fit}`
  return (
    <span className="cat-badge" style={categoryStyle(c.key)} title={`${c.label} (${c.english})`}>
      {showGlyph ? <span className="cat-glyph" aria-hidden="true">{glyph}</span> : <span className="cat-dot" aria-hidden="true" />}
      {c.label}
    </span>
  )
}

/** Beberapa kategori dominan (bisa seri). */
export function DominantCategories({ categories }) {
  if (!categories?.length) return <span className="faint">-</span>
  return (
    <span className="row" style={{ gap: 6 }}>
      {categories.map((key) => (
        <CategoryBadge key={key} category={key} />
      ))}
    </span>
  )
}
