import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Menampilkan materi berformat Markdown (judul, daftar, tabel, kutipan).
 * HTML mentah tidak dirender, sehingga aman dari skrip berbahaya.
 */
export function MarkdownContent({ children }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ''}</ReactMarkdown>
    </div>
  )
}
