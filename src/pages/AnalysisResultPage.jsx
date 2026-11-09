import { CalendarDays, Cpu, Database, FileDown, FileSpreadsheet, MessagesSquare, Printer, SearchX, Trash2, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ALL_CATEGORY_KEYS, CATEGORIES, CONTEXT_SUFFICIENCY, SPEECH_ACT_TYPES } from '../../shared/searle.js'
import { computeDistribution } from '../../shared/stats.js'
import { CategoryBadge, DominantCategories } from '../components/CategoryBadge.jsx'
import { CategoryDistributionChart, DistributionTable } from '../components/Charts.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { Alert, EmptyState, PageLoading, Spinner } from '../components/Feedback.jsx'
import { AnalysisFeedbackPanel, UtteranceFeedbackDialog } from '../components/FeedbackForms.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { UtteranceCard } from '../components/UtteranceCard.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { deleteAnalysis, getAnalysis } from '../services/analysisService.js'
import { exportAnalysisExcel, exportAnalysisPdf, printAnalysis } from '../services/exportService.js'
import { listFeedbackForAnalysis, submitFeedback } from '../services/feedbackService.js'
import { toFriendlyMessage } from '../utils/errors.js'
import { formatDateTime, formatNumber, formatPercent } from '../utils/format.js'

export default function AnalysisResultPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Data disimpan bersama id-nya; bila id di URL berubah, halaman otomatis menampilkan status memuat.
  const [loaded, setLoaded] = useState({ id: null, error: '', data: null })
  const [feedback, setFeedback] = useState([])
  const [filter, setFilter] = useState('semua')
  const [expanded, setExpanded] = useState(() => new Set())
  const [highlight, setHighlight] = useState(null)
  const [exporting, setExporting] = useState('')
  const [exportError, setExportError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reporting, setReporting] = useState(null)

  const state = loaded.id === id ? { loading: false, ...loaded } : { loading: true, error: '', data: null }
  useDocumentTitle(state.data?.analysis.title ?? 'Hasil analisis')

  useEffect(() => {
    let active = true
    Promise.all([getAnalysis(id), listFeedbackForAnalysis(id).catch(() => [])])
      .then(([data, fb]) => {
        if (!active) return
        setLoaded({ id, error: '', data })
        setFeedback(fb)
      })
      .catch((error) => active && setLoaded({ id, error: toFriendlyMessage(error, 'Gagal memuat hasil analisis.'), data: null }))
    return () => {
      active = false
    }
  }, [id])

  const utterances = useMemo(() => state.data?.utterances ?? [], [state.data])
  // Jumlah & persentase dihitung ulang dari data tuturan yang tersimpan.
  const stats = useMemo(() => computeDistribution(utterances), [utterances])
  const visible = filter === 'semua' ? utterances : utterances.filter((u) => u.category === filter)
  const unverifiedQuotes = utterances.filter((u) => !u.quote_verified).length
  const reportedUtterances = useMemo(() => new Set(feedback.map((f) => f.utterance_id).filter(Boolean)), [feedback])
  const utteranceNumberById = useMemo(() => Object.fromEntries(utterances.map((u) => [u.id, u.utterance_number])), [utterances])

  const toggle = useCallback((utteranceId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(utteranceId)) next.delete(utteranceId)
      else next.add(utteranceId)
      return next
    })
  }, [])

  function openUtterance(u) {
    setExpanded((prev) => new Set(prev).add(u.id))
    setHighlight(u.id)
    requestAnimationFrame(() => document.getElementById(`tuturan-${u.utterance_number}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    setTimeout(() => setHighlight(null), 2000)
  }

  async function runExport(kind) {
    setExporting(kind)
    setExportError('')
    try {
      const payload = { analysis: state.data.analysis, utterances, stats }
      if (kind === 'pdf') await exportAnalysisPdf(payload)
      else await exportAnalysisExcel(payload)
    } catch (error) {
      console.error(error)
      setExportError(kind === 'pdf' ? 'Gagal membuat file PDF. Silakan coba lagi.' : 'Gagal membuat file Excel. Silakan coba lagi.')
    } finally {
      setExporting('')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteAnalysis(id)
      navigate('/riwayat', { replace: true, state: { deletedTitle: state.data.analysis.title } })
    } catch (error) {
      setDeleting(false)
      setConfirmDelete(false)
      setExportError(toFriendlyMessage(error, 'Gagal menghapus analisis.'))
    }
  }

  async function sendFeedback(values) {
    await submitFeedback({ analysisId: id, userId: user.id, ...values })
    setFeedback(await listFeedbackForAnalysis(id))
  }

  if (state.loading) return <PageLoading label="Memuat hasil analisis…" />
  if (state.error) return <Alert type="error">{state.error}</Alert>
  if (!state.data) {
    return (
      <section className="panel">
        <EmptyState
          icon={SearchX}
          title="Analisis tidak ditemukan"
          action={
            <Link to="/riwayat" className="btn btn-secondary">
              Ke riwayat analisis
            </Link>
          }
        >
          Analisis ini mungkin sudah dihapus atau bukan milik akun Anda.
        </EmptyState>
      </section>
    )
  }

  const { analysis } = state.data
  const allExpanded = utterances.length > 0 && expanded.size === utterances.length

  return (
    <>
      <div className="print-only" style={{ marginBottom: 12 }}>
        <strong className="serif">PRAGMAAI</strong> <span className="muted">Laporan Analisis Tindak Tutur Ilokusi (Searle)</span>
      </div>

      <PageHeader
        title={analysis.title}
        backTo="/riwayat"
        backLabel="Riwayat analisis"
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => runExport('pdf')} disabled={Boolean(exporting)}>
              {exporting === 'pdf' ? <Spinner small /> : <FileDown size={17} aria-hidden="true" />}
              Unduh PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => runExport('excel')} disabled={Boolean(exporting)}>
              {exporting === 'excel' ? <Spinner small /> : <FileSpreadsheet size={17} aria-hidden="true" />}
              Export Excel
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => printAnalysis(analysis.title)}>
              <Printer size={17} aria-hidden="true" />
              Cetak
            </button>
            <button type="button" className="btn btn-danger-quiet" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={17} aria-hidden="true" />
              Hapus
            </button>
          </>
        }
      >
        <div className="meta-list">
          {analysis.data_source && (
            <span>
              <Database size={15} aria-hidden="true" />
              {analysis.data_source}
            </span>
          )}
          <span>
            <CalendarDays size={15} aria-hidden="true" />
            {formatDateTime(analysis.created_at)}
          </span>
          <span>
            <MessagesSquare size={15} aria-hidden="true" />
            {formatNumber(stats.total)} tuturan
          </span>
          {analysis.speakers?.length > 0 && (
            <span>
              <UsersRound size={15} aria-hidden="true" />
              {analysis.speakers.join(', ')}
            </span>
          )}
          {analysis.ai_model && (
            <span>
              <Cpu size={15} aria-hidden="true" />
              {analysis.ai_model}
            </span>
          )}
        </div>
      </PageHeader>

      <div className="stack">
        {location.state?.justCreated && (
          <Alert type="success" className="no-print">
            Analisis selesai dan tersimpan di riwayat. Hasil AI adalah analisis awal; periksa kembali setiap klasifikasi sebelum digunakan dalam penelitian.
          </Alert>
        )}
        {exportError && <Alert type="error">{exportError}</Alert>}
        {analysis.context_sufficiency && analysis.context_sufficiency !== 'memadai' && (
          <Alert type="warning" title={CONTEXT_SUFFICIENCY[analysis.context_sufficiency]?.label}>
            {analysis.context_note || 'Sebagian maksud penutur sulit dipastikan karena konteks kurang.'}
          </Alert>
        )}

        <div className="grid-main-side">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Distribusi kategori ilokusi</h2>
                <p>Dihitung dari {formatNumber(stats.total)} tuturan hasil analisis.</p>
              </div>
            </div>
            <CategoryDistributionChart rows={stats.rows} />
            <div className="mt-16">
              <DistributionTable rows={stats.rows} total={stats.total} />
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Ringkasan</h2>
            </div>
            <dl className="kv-grid" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
              <div className="kv kv-full">
                <dt>Kategori dominan</dt>
                <dd className="mt-8">
                  <DominantCategories categories={stats.dominant} />
                </dd>
              </div>
              <div className="kv kv-full">
                <dt>Tindak tutur langsung</dt>
                <dd>
                  {formatNumber(stats.speechActTypes.direct)} ({formatPercent(stats.speechActTypePercentages.direct)})
                </dd>
              </div>
              <div className="kv kv-full">
                <dt>Tindak tutur tidak langsung</dt>
                <dd>
                  {formatNumber(stats.speechActTypes.indirect)} ({formatPercent(stats.speechActTypePercentages.indirect)})
                </dd>
              </div>
              <div className="kv kv-full">
                <dt>Belum dapat dipastikan</dt>
                <dd>{formatNumber(stats.counts.undetermined)} tuturan</dd>
              </div>
              <div className="kv kv-full" style={{ borderBottom: 0 }}>
                <dt>Kecukupan konteks</dt>
                <dd>{CONTEXT_SUFFICIENCY[analysis.context_sufficiency]?.label ?? '-'}</dd>
              </div>
            </dl>
            {unverifiedQuotes > 0 && (
              <Alert type="warning" className="mt-16">
                {unverifiedQuotes} kutipan tuturan tidak ditemukan persis sama di teks asli. Periksa tuturan bertanda “Kutipan perlu dicek”.
              </Alert>
            )}
          </section>
        </div>

        <div className="grid-2">
          <section className="panel">
            <h2>Kesimpulan akademik</h2>
            <div className="prose-block mt-16">
              {(analysis.academic_conclusion || '-').split(/\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>Kesimpulan sederhana</h2>
            <div className="prose-block mt-16">
              {(analysis.simple_conclusion || '-').split(/\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        </div>

        <section className="panel">
          <h2>Temuan dominan</h2>
          {analysis.dominant_findings?.length ? (
            <ul className="findings mt-16">
              {analysis.dominant_findings.map((finding, i) => (
                <li key={i}>{finding}</li>
              ))}
            </ul>
          ) : (
            <p className="muted mt-8">Tidak ada temuan yang dicatat.</p>
          )}
          {analysis.limitations && (
            <>
              <h3 className="subheading">Keterbatasan analisis</h3>
              <p className="prose-block">{analysis.limitations}</p>
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Tabel klasifikasi tuturan</h2>
              <p className="no-print">Klik baris untuk membuka detail analisisnya.</p>
            </div>
          </div>

          <div className="filter-chips" role="group" aria-label="Saring berdasarkan kategori">
            <button type="button" className="filter-chip" aria-pressed={filter === 'semua'} onClick={() => setFilter('semua')}>
              Semua ({stats.total})
            </button>
            {ALL_CATEGORY_KEYS.filter((key) => stats.counts[key] > 0).map((key) => (
              <button key={key} type="button" className="filter-chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {CATEGORIES[key].label} ({stats.counts[key]})
              </button>
            ))}
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="col-no">No</th>
                  <th>Penutur</th>
                  <th>Tuturan</th>
                  <th>Kategori</th>
                  <th>Tindak ilokusi</th>
                  <th>Jenis</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr
                    key={u.id}
                    className="row-link"
                    tabIndex={0}
                    onClick={() => openUtterance(u)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openUtterance(u)
                      }
                    }}
                  >
                    <td className="col-no">{u.utterance_number}</td>
                    <td className="nowrap">
                      {u.speaker}
                      <div className="small faint">ke {u.addressee}</div>
                    </td>
                    <td className="quote">{u.utterance_text}</td>
                    <td>
                      <CategoryBadge category={u.category} />
                    </td>
                    <td>{u.specific_act || '-'}</td>
                    <td className="nowrap">{SPEECH_ACT_TYPES[u.speech_act_type]?.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Detail analisis per tuturan</h2>
              <p>Illocutionary point, F(p), IFIDs, direction of fit, felicity conditions, dan penjelasan.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={() => setExpanded(allExpanded ? new Set() : new Set(utterances.map((u) => u.id)))}
            >
              {allExpanded ? 'Tutup semua' : 'Buka semua'}
            </button>
          </div>

          {visible.map((u) => (
            <UtteranceCard
              key={u.id}
              utterance={u}
              expanded={expanded.has(u.id)}
              highlighted={highlight === u.id}
              onToggle={() => toggle(u.id)}
              onReport={setReporting}
              reported={reportedUtterances.has(u.id)}
            />
          ))}
        </section>

        <details className="panel no-print">
          <summary style={{ cursor: 'pointer' }}>
            <h2 style={{ display: 'inline' }}>Data asli</h2>
          </summary>
          {analysis.conversation_context && (
            <>
              <h3 className="subheading">Konteks percakapan</h3>
              <p className="prose-block">{analysis.conversation_context}</p>
            </>
          )}
          <h3 className="subheading">Teks dialog</h3>
          <pre className="serif" style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '1rem', lineHeight: 1.7 }}>
            {analysis.dialogue_text}
          </pre>
        </details>

        <AnalysisFeedbackPanel feedback={feedback} onSubmit={sendFeedback} utteranceNumberById={utteranceNumberById} />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus analisis ini?"
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        confirmLabel="Hapus analisis"
      >
        “{analysis.title}” beserta {stats.total} tuturan dan umpan baliknya akan dihapus permanen.
      </ConfirmDialog>

      {reporting && <UtteranceFeedbackDialog utterance={reporting} onSubmit={sendFeedback} onClose={() => setReporting(null)} />}
    </>
  )
}
