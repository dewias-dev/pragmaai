import { useEffect, useState } from 'react'

/** Menunda perubahan nilai (misalnya kotak pencarian) agar tidak memanggil database setiap ketikan. */
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
