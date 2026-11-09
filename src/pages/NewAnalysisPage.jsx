import { Cpu, Sparkles, Wand2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { LIMITS } from '../../shared/limits.js'
import { AnalysisProgress } from '../components/AnalysisProgress.jsx'
import { Alert } from '../components/Feedback.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { createAnalysis, getBackendInfo } from '../services/analysisService.js'
import { formatNumber } from '../utils/format.js'
import { SAMPLE_ANALYSIS } from '../utils/sampleDialogue.js'

const EMPTY_FORM = { title: '', dataSource: '', context: '', dialogue: '' }

/** Mencari nama penutur dari baris berformat "Nama: tuturan". */
function detectSpeakers(dialogue) {
  const names = new Set()
  for (const line of dialogue.split('\n')) {
    const match = /^\s*([A-Za-zÀ-ÿ][\w .'’-]{0,40}?)\s*:\s+\S/.exec(line)
    if (match) names.add(match[1].trim())
  }
  return [...names].slice(0, LIMITS.speakersMax)
}

export default function NewAnalysisPage() {
  useDocumentTitle('Analisis baru')
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [speakers, setSpeakers] = useState([])
  const [speakerInput, setSpeakerInput] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [backend, setBackend] = useState(null)

  // Menampilkan model AI yang sedang dipakai server (OpenRouter/OpenAI).
  useEffect(() => {
    let active = true
    getBackendInfo().then((info) => active && setBackend(info))
    return () => {
      active = false
    }
  }, [])

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))
  const lineCount = useMemo(() => form.dialogue.split('\n').filter((l) => l.trim()).length, [form.dialogue])
  const dialogueTooLong = form.dialogue.length > LIMITS.dialogueMax

  function addSpeakers(raw) {
    const names = raw
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .map((n) => n.slice(0, LIMITS.speakerNameMax))
    if (!names.length) return
    setSpeakers((prev) => [...new Set([...prev, ...names])].slice(0, LIMITS.speakersMax))
    setSpeakerInput('')
  }

  function handleSpeakerKey(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addSpeakers(speakerInput)
    } else if (event.key === 'Backspace' && !speakerInput && speakers.length) {
      setSpeakers((prev) => prev.slice(0, -1))
    }
  }

  function fillSample() {
    setForm({ title: SAMPLE_ANALYSIS.title, dataSource: SAMPLE_ANALYSIS.dataSource, context: SAMPLE_ANALYSIS.context, dialogue: SAMPLE_ANALYSIS.dialogue })
    setSpeakers(SAMPLE_ANALYSIS.speakers)
    setErrors({})
  }

  function validate() {
    const next = {}
    const title = form.title.trim()
    if (title.length < LIMITS.titleMin) next.title = 'Judul minimal 3 karakter.'
    if (title.length > LIMITS.titleMax) next.title = `Judul maksimal ${LIMITS.titleMax} karakter.`
    if (form.dataSource.length > LIMITS.sourceMax) next.dataSource = `Sumber data maksimal ${LIMITS.sourceMax} karakter.`
    if (form.context.length > LIMITS.contextMax) next.context = `Konteks maksimal ${formatNumber(LIMITS.contextMax)} karakter.`
    if (form.dialogue.trim().length < LIMITS.dialogueMin) next.dialogue = 'Tempel teks dialog yang akan dianalisis.'
    if (dialogueTooLong) next.dialogue = `Dialog maksimal ${formatNumber(LIMITS.dialogueMax)} karakter. Bagi menjadi beberapa analisis.`
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerError('')
    if (!validate() || submitting) return

    const pendingSpeaker = speakerInput.trim()
    const allSpeakers = pendingSpeaker ? [...new Set([...speakers, pendingSpeaker])] : speakers

    setSubmitting(true)
    try {
      const result = await createAnalysis({
        title: form.title,
        dataSource: form.dataSource,
        context: form.context,
        speakers: allSpeakers,
        dialogue: form.dialogue,
      })
      navigate(`/analisis/${result.id}`, { state: { justCreated: true } })
    } catch (error) {
      setSubmitting(false)
      if (error.details) setErrors(error.details)
      setServerError(error.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <PageHeader
        title="Analisis baru"
        description="Masukkan dialog atau transkrip beserta konteksnya. Semakin jelas konteks, semakin akurat klasifikasi tindak tuturnya."
        actions={
          <button type="button" className="btn btn-secondary" onClick={fillSample} disabled={submitting}>
            <Wand2 size={17} aria-hidden="true" />
            Isi contoh
          </button>
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        {serverError && (
          <Alert type="error" title="Analisis belum berhasil" className="mt-8">
            {serverError}
          </Alert>
        )}

        {backend?.isFreeModel && (
          <Alert type="warning" title="Anda memakai model AI gratis" className="mt-8">
            <ul>
              <li>Analisis lebih lambat (biasanya 1–4 menit) dan disarankan untuk dialog pendek, maksimal sekitar {backend.maxUtterances} unit tuturan.</li>
              <li>Kuota OpenRouter untuk model gratis terbatas: 20 permintaan per menit dan 50 per hari tanpa kredit. Satu analisis memakai beberapa permintaan.</li>
              <li>Penyedia model gratis dapat mencatat isi dialog untuk meningkatkan layanannya. Jangan memasukkan data pribadi atau rahasia.</li>
            </ul>
          </Alert>
        )}

        <section className="panel" style={{ marginTop: serverError || backend?.isFreeModel ? 16 : 0 }}>
          <div className="panel-header">
            <div>
              <h2>Identitas data</h2>
              <p>Informasi ini membantu Anda menemukan analisis kembali dan muncul di laporan export.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="title">
                Judul penelitian atau analisis
              </label>
              <input
                id="title"
                className="input"
                value={form.title}
                onChange={update('title')}
                maxLength={LIMITS.titleMax}
                placeholder="Misalnya: Tindak tutur direktif dalam film Laskar Pelangi"
                aria-invalid={errors.title ? 'true' : undefined}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="form-row">
              <div className="field">
                <label className="label" htmlFor="dataSource">
                  Sumber data <span className="label-optional">(opsional)</span>
                </label>
                <input
                  id="dataSource"
                  className="input"
                  value={form.dataSource}
                  onChange={update('dataSource')}
                  maxLength={LIMITS.sourceMax}
                  placeholder="Film, episode, wawancara, menit ke-…"
                  aria-invalid={errors.dataSource ? 'true' : undefined}
                />
                {errors.dataSource && <span className="field-error">{errors.dataSource}</span>}
              </div>

              <div className="field">
                <label className="label" htmlFor="speakers">
                  Nama pembicara <span className="label-optional">(opsional)</span>
                </label>
                <input
                  id="speakers"
                  className="input"
                  value={speakerInput}
                  onChange={(e) => setSpeakerInput(e.target.value)}
                  onKeyDown={handleSpeakerKey}
                  onBlur={() => addSpeakers(speakerInput)}
                  placeholder="Ketik nama, lalu tekan Enter"
                  disabled={speakers.length >= LIMITS.speakersMax}
                />
                {speakers.length > 0 && (
                  <div className="chips">
                    {speakers.map((name) => (
                      <span key={name} className="chip">
                        {name}
                        <button type="button" onClick={() => setSpeakers((prev) => prev.filter((n) => n !== name))} aria-label={`Hapus ${name}`}>
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.speakers && <span className="field-error">{errors.speakers}</span>}
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="context">
                Konteks percakapan <span className="label-optional">(sangat disarankan)</span>
              </label>
              <textarea
                id="context"
                className="textarea"
                rows={4}
                value={form.context}
                onChange={update('context')}
                maxLength={LIMITS.contextMax}
                placeholder="Siapa para pembicara, apa hubungan mereka, di mana dan kapan percakapan terjadi, serta apa yang terjadi sebelumnya."
                aria-invalid={errors.context ? 'true' : undefined}
              />
              <div className="field-footer">
                {errors.context ? (
                  <span className="field-error">{errors.context}</span>
                ) : (
                  <span className="hint">Tanpa konteks, sebagian tuturan mungkin ditandai “belum dapat dipastikan”.</span>
                )}
                <span className="char-count">
                  {formatNumber(form.context.length)} / {formatNumber(LIMITS.contextMax)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Teks dialog atau transkrip</h2>
              <p>Tulis satu giliran bicara per baris dengan format “Nama: tuturan”. Petunjuk adegan dalam kurung tidak ikut dianalisis.</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSpeakers((prev) => [...new Set([...prev, ...detectSpeakers(form.dialogue)])].slice(0, LIMITS.speakersMax))}
              disabled={!form.dialogue.trim()}
            >
              Deteksi nama pembicara
            </button>
          </div>

          <div className="field">
            <label className="visually-hidden" htmlFor="dialogue">
              Teks dialog
            </label>
            <textarea
              id="dialogue"
              className="textarea textarea-dialogue"
              value={form.dialogue}
              onChange={update('dialogue')}
              placeholder={'Rina: Makalah kita belum ada daftar pustakanya.\nDimas: Maaf, aku lupa.\nRina: Bisa kamu kerjakan malam ini?'}
              aria-invalid={errors.dialogue ? 'true' : undefined}
            />
            <div className="field-footer">
              {errors.dialogue ? (
                <span className="field-error">{errors.dialogue}</span>
              ) : (
                <span className="hint">{formatNumber(lineCount)} baris. Dialog panjang dapat dibagi menjadi beberapa analisis.</span>
              )}
              <span className={`char-count ${dialogueTooLong ? 'over' : ''}`}>
                {formatNumber(form.dialogue.length)} / {formatNumber(LIMITS.dialogueMax)} karakter
              </span>
            </div>
          </div>

          <div className="row-between mt-24">
            <p className="small muted" style={{ maxWidth: '60ch' }}>
              {backend?.model && (
                <span className="row" style={{ gap: 6, marginBottom: 4 }}>
                  <Cpu size={14} aria-hidden="true" />
                  Model AI: {backend.model} ({backend.providerLabel})
                </span>
              )}
              Dialog dikirim ke penyedia AI melalui server PragmaAI untuk dianalisis. Hasil AI perlu diverifikasi peneliti.
            </p>
            <button type="submit" className="btn btn-primary" disabled={submitting || dialogueTooLong}>
              <Sparkles size={18} aria-hidden="true" />
              Analisis dengan AI
            </button>
          </div>
        </section>
      </form>

      {submitting && <AnalysisProgress utteranceEstimate={lineCount} slowModel={Boolean(backend?.isFreeModel)} />}
    </>
  )
}
