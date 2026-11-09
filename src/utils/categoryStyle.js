import { CATEGORIES } from '../../shared/searle.js'

/** Variabel CSS --cat berisi warna kategori, dipakai badge, bar, dan kartu. */
export function categoryStyle(key) {
  return { '--cat': CATEGORIES[key]?.color ?? CATEGORIES.undetermined.color }
}
