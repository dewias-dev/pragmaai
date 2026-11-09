import { useEffect } from 'react'

/** Mengatur judul tab browser untuk setiap halaman. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} – PragmaAI` : 'PragmaAI – Intelligent Pragmatic Speech Act Analysis'
  }, [title])
}
