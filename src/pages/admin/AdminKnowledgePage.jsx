import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx'
import { Alert, PageLoading, Spinner } from '../../components/Feedback.jsx'
import { MarkdownContent } from '../../components/MarkdownContent.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { createArticle, deleteArticle, getArticleById, listArticles, updateArticle } from '../../services/knowledgeService.js'
import { toFriendlyMessage } from '../../utils/errors.js'
import { formatDate, slugify } from '../../utils/format.js'

const EMPTY = { title: '', slug: '', topic: 'Umum', summary: '', content: '', sort_order: 100, is_published: true }

/** Form tambah/edit materi dengan pratinjau Markdown. */
function ArticleEditor({ initial, onCancel, onSaved }) {
  const isNew = !initial.id
  const [form, setForm] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [tab, setTab] = useState('tulis')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (form.title.trim().length < 3) return setError('Judul minimal 3 karakter.')
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return setError('Slug hanya boleh huruf kecil, angka, dan tanda hubung.')
    if (!form.content.trim()) return setError('Isi materi tidak boleh kosong.')

    setBusy(true)
    try {
      if (isNew) await createArticle(form)
      else await updateArticle(initial.id, form)
      onSaved(isNew ? `Materi “${form.title}” ditambahkan.` : `Materi “${form.title}” diperbarui.`)
    } catch (err) {
      setError(toFriendlyMessage(err, 'Gagal menyimpan materi.'))
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{isNew ? 'Tambah materi' : 'Edit materi'}</h2>
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        {error && <Alert type="error">{error}</Alert>}
        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="kb-title">
              Judul
            </label>
            <input
              id="kb-title"
              className="input"
              maxLength={200}
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value)
                if (!slugTouched) set('slug', slugify(e.target.value))
              }}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="kb-slug">
              Slug (alamat halaman)
            </label>
            <input
              id="kb-slug"
              className="input"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', slugify(e.target.value))
              }}
            />
            <span className="hint">/materi/{form.slug || '…'}</span>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="kb-topic">
              Topik
            </label>
            <input id="kb-topic" className="input" maxLength={80} value={form.topic} onChange={(e) => set('topic', e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="kb-order">
              Urutan tampil
            </label>
            <input id="kb-order" type="number" className="input" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="kb-summary">
            Ringkasan singkat
          </label>
          <input id="kb-summary" className="input" maxLength={500} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
        </div>

        <div className="field">
          <span className="label">Isi materi (Markdown)</span>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" className="tab" aria-selected={tab === 'tulis'} onClick={() => setTab('tulis')}>
              Tulis
            </button>
            <button type="button" role="tab" className="tab" aria-selected={tab === 'pratinjau'} onClick={() => setTab('pratinjau')}>
              Pratinjau
            </button>
          </div>
          {tab === 'tulis' ? (
            <>
              <textarea
                className="textarea"
                rows={18}
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                aria-label="Isi materi"
                style={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '0.92rem' }}
              />
              <span className="hint">Gunakan ## untuk subjudul, - untuk daftar, **tebal**, *miring*, &gt; untuk kutipan, dan tabel Markdown.</span>
            </>
          ) : (
            <div className="panel" style={{ background: 'var(--surface-sunken)' }}>
              <MarkdownContent>{form.content}</MarkdownContent>
            </div>
          )}
        </div>

        <label className="checkbox">
          <input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} />
          Terbitkan (terlihat oleh semua pengguna)
        </label>

        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy && <Spinner small />}
            {isNew ? 'Tambah materi' : 'Simpan perubahan'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Batal
          </button>
        </div>
      </form>
    </section>
  )
}

export default function AdminKnowledgePage() {
  useDocumentTitle('Kelola materi')
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(
    () =>
      listArticles({ includeDrafts: true })
        .then((data) => {
          setArticles(data)
          setStatus({ loading: false, error: '' })
        })
        .catch((error) => setStatus({ loading: false, error: toFriendlyMessage(error, 'Gagal memuat materi.') })),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  // Membuka editor langsung dari tombol "Edit materi" di halaman artikel (?edit=<id>).
  const editId = searchParams.get('edit')
  useEffect(() => {
    if (!editId) return
    getArticleById(editId)
      .then((article) => article && setEditing(article))
      .catch(() => {})
  }, [editId])

  function closeEditor() {
    setEditing(null)
    if (editId) setSearchParams({})
  }

  async function handleSaved(message) {
    closeEditor()
    setNotice(message)
    await load()
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteArticle(toDelete.id)
      setNotice(`Materi “${toDelete.title}” dihapus.`)
      setToDelete(null)
      await load()
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: toFriendlyMessage(error, 'Gagal menghapus materi.') }))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Kelola materi"
        description="Tambah, ubah, terbitkan, atau hapus materi knowledge base."
        actions={
          !editing && (
            <button type="button" className="btn btn-primary" onClick={() => setEditing({ ...EMPTY })}>
              <Plus size={18} aria-hidden="true" />
              Tambah materi
            </button>
          )
        }
      />

      <div className="stack">
        {notice && <Alert type="success">{notice}</Alert>}
        {status.error && <Alert type="error">{status.error}</Alert>}

        {editing && (
          <ArticleEditor
            key={editing.id ?? 'baru'}
            initial={{ ...EMPTY, ...editing }}
            onCancel={closeEditor}
            onSaved={handleSaved}
          />
        )}

        <section className="panel">
          {status.loading ? (
            <PageLoading label="Memuat materi…" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="num">Urutan</th>
                    <th>Judul</th>
                    <th>Topik</th>
                    <th>Status</th>
                    <th>Diperbarui</th>
                    <th>
                      <span className="visually-hidden">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id}>
                      <td className="num">{article.sort_order}</td>
                      <td>
                        <strong>{article.title}</strong>
                        <div className="small faint">/materi/{article.slug}</div>
                      </td>
                      <td>{article.topic}</td>
                      <td>
                        <span className={`badge ${article.is_published ? 'badge-success' : 'badge-warning'}`}>
                          {article.is_published ? 'Terbit' : 'Draf'}
                        </span>
                      </td>
                      <td className="nowrap">{formatDate(article.updated_at)}</td>
                      <td>
                        <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                          <Link to={`/materi/${article.slug}`} className="btn btn-ghost btn-icon" aria-label={`Lihat ${article.title}`}>
                            <Eye size={16} />
                          </Link>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon"
                            aria-label={`Edit ${article.title}`}
                            onClick={async () => {
                              try {
                                setEditing(await getArticleById(article.id))
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              } catch (error) {
                                setStatus((prev) => ({ ...prev, error: toFriendlyMessage(error) }))
                              }
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button type="button" className="btn btn-danger-quiet btn-icon" aria-label={`Hapus ${article.title}`} onClick={() => setToDelete(article)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {articles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="muted">
                        Belum ada materi. Jalankan supabase/seed_knowledge_base.sql atau tambahkan materi baru.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Hapus materi ini?"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        confirmLabel="Hapus materi"
      >
        Materi “{toDelete?.title}” akan dihapus permanen dari knowledge base.
      </ConfirmDialog>
    </>
  )
}
