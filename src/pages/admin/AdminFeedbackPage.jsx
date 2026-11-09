import { MessageSquareWarning } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { CategoryBadge } from '../../components/CategoryBadge.jsx'
import { Alert, EmptyState, PageLoading, Spinner } from '../../components/Feedback.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { listAllFeedback, reviewFeedback } from '../../services/adminService.js'
import { toFriendlyMessage } from '../../utils/errors.js'
import { formatDateTime } from '../../utils/format.js'

const STATUSES = [
  { key: 'semua', label: 'Semua' },
  { key: 'baru', label: 'Baru' },
  { key: 'ditinjau', label: 'Ditinjau' },
  { key: 'selesai', label: 'Selesai' },
]

function FeedbackItem({ item, onSaved }) {
  const [status, setStatus] = useState(item.status)
  const [note, setNote] = useState(item.admin_note)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dirty = status !== item.status || note !== item.admin_note

  async function save() {
    setBusy(true)
    setError('')
    try {
      await reviewFeedback(item.id, { status, adminNote: note })
      await onSaved()
    } catch (err) {
      setError(toFriendlyMessage(err, 'Gagal menyimpan tinjauan.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="utterance-card" style={{ padding: 18 }}>
      <div className="row-between">
        <div className="row" style={{ gap: 8 }}>
          <strong>{item.utterance_snapshot ? 'Klasifikasi tuturan' : 'Penilaian analisis'}</strong>
          {item.rating && <span className="badge">{item.rating}/5</span>}
          <span className={`badge ${item.status === 'baru' ? 'badge-warning' : item.status === 'selesai' ? 'badge-success' : 'badge-info'}`}>
            {STATUSES.find((s) => s.key === item.status)?.label}
          </span>
        </div>
        <span className="small faint">
          {item.user?.full_name || item.user?.email || 'Pengguna'}, {formatDateTime(item.created_at)}
        </span>
      </div>

      {item.utterance_snapshot && (
        <div className="mt-16">
          <p className="serif" style={{ fontSize: '1.05rem' }}>
            “{item.utterance_snapshot}”
          </p>
          <div className="row mt-8 small">
            <span className="muted">AI:</span>
            <CategoryBadge category={item.ai_category_snapshot} />
            {item.suggested_category && (
              <>
                <span className="muted">Usulan pengguna:</span>
                <CategoryBadge category={item.suggested_category} />
              </>
            )}
          </div>
        </div>
      )}
      {item.comment && <p className="mt-16">{item.comment}</p>}

      <div className="form-row mt-16" style={{ alignItems: 'end' }}>
        <div className="field">
          <label className="label" htmlFor={`note-${item.id}`}>
            Catatan admin (terlihat oleh pengguna)
          </label>
          <input id={`note-${item.id}`} className="input" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="row">
          <label className="visually-hidden" htmlFor={`status-${item.id}`}>
            Status
          </label>
          <select id={`status-${item.id}`} className="select" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.slice(1).map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" disabled={!dirty || busy} onClick={save}>
            {busy && <Spinner small />}
            Simpan
          </button>
        </div>
      </div>
      {error && (
        <Alert type="error" className="mt-8">
          {error}
        </Alert>
      )}
    </article>
  )
}

export default function AdminFeedbackPage() {
  useDocumentTitle('Umpan balik')
  const [filter, setFilter] = useState('baru')
  const [loaded, setLoaded] = useState({ filter: null, items: [], error: '' })
  const state = { loading: loaded.filter !== filter, error: loaded.filter === filter ? loaded.error : '' }
  const items = loaded.filter === filter ? loaded.items : []

  const load = useCallback(
    () =>
      listAllFeedback({ status: filter })
        .then((data) => setLoaded({ filter, items: data, error: '' }))
        .catch((error) => setLoaded({ filter, items: [], error: toFriendlyMessage(error, 'Gagal memuat umpan balik.') })),
    [filter],
  )

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <PageHeader
        title="Umpan balik pengguna"
        description="Laporan klasifikasi keliru dan penilaian hasil analisis. Gunakan untuk mengevaluasi kualitas AI dan memperbaiki materi."
      />

      <div className="stack">
        <div className="tabs" role="tablist" aria-label="Status umpan balik">
          {STATUSES.map((s) => (
            <button key={s.key} type="button" role="tab" className="tab" aria-selected={filter === s.key} onClick={() => setFilter(s.key)}>
              {s.label}
            </button>
          ))}
        </div>

        {state.error && <Alert type="error">{state.error}</Alert>}

        {state.loading ? (
          <PageLoading label="Memuat umpan balik…" />
        ) : items.length === 0 ? (
          <section className="panel">
            <EmptyState icon={MessageSquareWarning} title="Tidak ada umpan balik">
              {filter === 'baru' ? 'Semua umpan balik sudah ditinjau.' : 'Belum ada umpan balik dengan status ini.'}
            </EmptyState>
          </section>
        ) : (
          <div>
            {items.map((item) => (
              <FeedbackItem key={item.id} item={item} onSaved={load} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
