import { BookOpenText, Search, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CATEGORIES, CATEGORY_KEYS } from '../../shared/searle.js'
import { Alert, EmptyState, PageLoading } from '../components/Feedback.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { listArticles } from '../services/knowledgeService.js'
import { categoryStyle } from '../utils/categoryStyle.js'
import { toFriendlyMessage } from '../utils/errors.js'

export default function KnowledgeBasePage() {
  useDocumentTitle('Knowledge base')
  const { isAdmin } = useAuth()
  const [articles, setArticles] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [query, setQuery] = useState('')

  useEffect(() => {
    listArticles()
      .then((data) => {
        setArticles(data)
        setStatus({ loading: false, error: '' })
      })
      .catch((error) => setStatus({ loading: false, error: toFriendlyMessage(error, 'Gagal memuat materi.') }))
  }, [])

  const grouped = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = term
      ? articles.filter((a) => `${a.title} ${a.summary} ${a.topic}`.toLowerCase().includes(term))
      : articles
    const groups = new Map()
    for (const article of filtered) {
      if (!groups.has(article.topic)) groups.set(article.topic, [])
      groups.get(article.topic).push(article)
    }
    return [...groups.entries()]
  }, [articles, query])

  return (
    <>
      <PageHeader
        title="Knowledge base"
        description="Materi teori pragmatik dan tindak tutur Searle sebagai dasar membaca hasil analisis."
        actions={
          isAdmin && (
            <Link to="/admin/materi" className="btn btn-secondary">
              <Settings2 size={17} aria-hidden="true" />
              Kelola materi
            </Link>
          )
        }
      />

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Lima kategori ilokusi Searle</h2>
            <p>Simbol pertama adalah penanda daya ilokusi, simbol kedua arah kesesuaian (direction of fit).</p>
          </div>
        </div>
        <div className="category-cards">
          {CATEGORY_KEYS.map((key) => {
            const c = CATEGORIES[key]
            return (
              <div key={key} className="category-card" style={categoryStyle(key)}>
                <h3>{c.label}</h3>
                <div className="notation">{c.english}</div>
                <div className="notation">{c.notation}</div>
                <p>{c.definition}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="kb-search">
              Cari materi
            </label>
            <input id="kb-search" type="search" className="input" placeholder="Cari materi" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {status.loading ? (
          <PageLoading label="Memuat materi…" />
        ) : status.error ? (
          <Alert type="error">{status.error}</Alert>
        ) : grouped.length === 0 ? (
          <EmptyState icon={BookOpenText} title={query ? 'Materi tidak ditemukan' : 'Belum ada materi'}>
            {query
              ? 'Coba kata kunci lain.'
              : 'Jalankan supabase/seed_knowledge_base.sql untuk memuat materi awal, atau tambahkan materi dari menu admin.'}
          </EmptyState>
        ) : (
          grouped.map(([topic, items]) => (
            <div key={topic}>
              <h2 className="kb-section-title">{topic}</h2>
              <div className="kb-grid">
                {items.map((article) => (
                  <Link key={article.id} to={`/materi/${article.slug}`} className="kb-card">
                    <h3>{article.title}</h3>
                    {article.summary && <p>{article.summary}</p>}
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  )
}
