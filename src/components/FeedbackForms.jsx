import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ALL_CATEGORY_KEYS, CATEGORIES } from '../../shared/searle.js'
import { toFriendlyMessage } from '../utils/errors.js'
import { formatDateTime } from '../utils/format.js'
import { Alert, Spinner } from './Feedback.jsx'

const STATUS_LABEL = { baru: 'Menunggu tinjauan', ditinjau: 'Sedang ditinjau', selesai: 'Selesai ditinjau' }

/** Dialog untuk melaporkan klasifikasi satu tuturan yang dianggap keliru. */
export function UtteranceFeedbackDialog({ utterance, onSubmit, onClose }) {
  const [suggested, setSuggested] = useState('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!suggested && !comment.trim()) {
      setError('Pilih kategori yang menurut Anda tepat atau tulis komentar.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSubmit({ utteranceId: utterance.id, suggestedCategory: suggested, isAccurate: false, comment })
      onClose()
    } catch (err) {
      setError(toFriendlyMessage(err, 'Gagal mengirim umpan balik.'))
      setBusy(false)
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="dialog dialog-wide" role="dialog" aria-modal="true" aria-labelledby="fb-title" onSubmit={handleSubmit}>
        <h2 id="fb-title">Laporkan klasifikasi tuturan ({utterance.utterance_number})</h2>
        <p className="dialog-body serif">“{utterance.utterance_text}”</p>
        <p className="small muted mt-8">
          Klasifikasi AI: <strong>{CATEGORIES[utterance.category]?.label}</strong>. Laporan Anda dibaca admin untuk mengevaluasi kualitas analisis.
        </p>

        <div className="form-grid mt-16">
          {error && <Alert type="error">{error}</Alert>}
          <div className="field">
            <label className="label" htmlFor="fb-category">
              Menurut Anda, kategori yang tepat
            </label>
            <select id="fb-category" className="select" value={suggested} onChange={(e) => setSuggested(e.target.value)}>
              <option value="">Pilih kategori</option>
              {ALL_CATEGORY_KEYS.filter((key) => key !== utterance.category).map((key) => (
                <option key={key} value={key}>
                  {CATEGORIES[key].label} ({CATEGORIES[key].english})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="fb-comment">
              Alasan <span className="label-optional">(opsional)</span>
            </label>
            <textarea id="fb-comment" className="textarea" rows={3} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy && <Spinner small />}
            Kirim laporan
          </button>
        </div>
      </form>
    </div>
  )
}

/** Penilaian keseluruhan analisis (bintang 1–5 + komentar) dan riwayat umpan balik pengguna. */
export function AnalysisFeedbackPanel({ feedback, onSubmit, utteranceNumberById }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!rating) {
      setMessage({ type: 'error', text: 'Pilih penilaian bintang terlebih dahulu.' })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      await onSubmit({ rating, comment, isAccurate: rating >= 4 })
      setRating(0)
      setComment('')
      setMessage({ type: 'success', text: 'Terima kasih, penilaian Anda tersimpan.' })
    } catch (err) {
      setMessage({ type: 'error', text: toFriendlyMessage(err, 'Gagal menyimpan penilaian.') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel no-print">
      <div className="panel-header">
        <div>
          <h2>Umpan balik untuk hasil ini</h2>
          <p>Seberapa tepat analisis AI ini menurut Anda?</p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        {message && <Alert type={message.type}>{message.text}</Alert>}
        <div className="row" role="radiogroup" aria-label="Penilaian">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} dari 5`}
              className="btn btn-ghost btn-icon"
              onClick={() => setRating(n)}
            >
              <Star size={22} fill={n <= rating ? '#2f5bd3' : 'none'} color={n <= rating ? '#2f5bd3' : '#8590a6'} />
            </button>
          ))}
          <span className="small muted">{rating ? `${rating} dari 5` : 'Belum dinilai'}</span>
        </div>
        <div className="field">
          <label className="label" htmlFor="analysis-comment">
            Komentar <span className="label-optional">(opsional)</span>
          </label>
          <textarea id="analysis-comment" className="textarea" rows={3} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy && <Spinner small />}
            Kirim penilaian
          </button>
        </div>
      </form>

      {feedback.length > 0 && (
        <>
          <h3 className="subheading">Umpan balik yang sudah Anda kirim</h3>
          <div className="list">
            {feedback.map((item) => (
              <div key={item.id} className="list-item" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
                <div>
                  <div className="row" style={{ gap: 8 }}>
                    <strong className="small">
                      {item.utterance_id ? `Tuturan (${utteranceNumberById[item.utterance_id] ?? '?'})` : 'Analisis keseluruhan'}
                    </strong>
                    {item.rating && <span className="badge">{item.rating}/5</span>}
                    {item.suggested_category && <span className="badge badge-info">Usulan: {CATEGORIES[item.suggested_category]?.label}</span>}
                    <span className={`badge ${item.status === 'selesai' ? 'badge-success' : ''}`}>{STATUS_LABEL[item.status]}</span>
                  </div>
                  {item.comment && <p className="small mt-8">{item.comment}</p>}
                  {item.admin_note && <p className="small muted mt-8">Catatan admin: {item.admin_note}</p>}
                  <p className="small faint mt-8">{formatDateTime(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
