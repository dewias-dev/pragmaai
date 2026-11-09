import { useSyncExternalStore } from 'react'

/** true bila ukuran layar cocok dengan media query, misalnya '(max-width: 600px)'. */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
