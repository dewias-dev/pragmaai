import { BookX, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Alert, EmptyState, PageLoading } from '../components/Feedback.jsx'
import { MarkdownContent } from '../components/MarkdownContent.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getArticleBySlug } from '../services/knowledgeService.js'
import { toFriendlyMessage } from '../utils/errors.js'
import { formatDate } from '../utils/format.js'

export default function KnowledgeArticlePage() {
  const { slug } = useParams()
  const { isAdmin } = useAuth()
  const [loaded, setLoaded] = useState({ slug: null, error: '', article: null })
  const state = loaded.slug === slug ? { loading: false, ...loaded } : { loading: true, error: '', article: null }
  useDocumentTitle(state.article?.title ?? 'Materi')

  useEffect(() => {
    let active = true
    getArticleBySlug(slug)
      .then((article) => active && setLoaded({ slug, error: '', article }))
      .catch((error) => active && setLoaded({ slug, error: toFriendlyMessage(error, 'Gagal memuat materi.'), article: null }))
    return () => {
      active = false
    }
  }, [slug])

  if (state.loading) return <PageLoading label="Memuat materi…" />
  if (state.error) return <Alert type="error">{state.error}</Alert>
  if (!state.article) {
    return (
      <section className="panel">
        <EmptyState
          icon={BookX}
          title="Materi tidak ditemukan"
          action={
            <Link to="/materi" className="btn btn-secondary">
              Ke knowledge base
            </Link>
          }
        />
      </section>
    )
  }

  const { article } = state
  return (
    <>
      <PageHeader
        title={article.title}
        description={article.summary}
        backTo="/materi"
        backLabel="Knowledge base"
        actions={
          isAdmin && (
            <Link to={`/admin/materi?edit=${article.id}`} className="btn btn-secondary">
              <Pencil size={16} aria-hidden="true" />
              Edit materi
            </Link>
          )
        }
      >
        <div className="meta-list">
          <span className="badge badge-info">{article.topic}</span>
          <span>Diperbarui {formatDate(article.updated_at)}</span>
          {!article.is_published && <span className="badge badge-warning">Draf, belum terbit</span>}
        </div>
      </PageHeader>

      <article className="panel">
        <MarkdownContent>{article.content}</MarkdownContent>
      </article>
    </>
  )
}
