import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '../components/Feedback.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFoundPage() {
  useDocumentTitle('Halaman tidak ditemukan')
  return (
    <section className="panel">
      <EmptyState
        icon={Compass}
        title="Halaman tidak ditemukan"
        action={
          <Link to="/" className="btn btn-primary">
            Ke dashboard
          </Link>
        }
      >
        Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
      </EmptyState>
    </section>
  )
}
