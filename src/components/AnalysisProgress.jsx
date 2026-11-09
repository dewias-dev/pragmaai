import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Spinner } from './Feedback.jsx'

/**
 * Indikator saat AI bekerja. Server tidak mengirim progres per langkah,
 * jadi langkah di bawah ini adalah perkiraan berdasarkan waktu yang berjalan.
 */
const STEPS = [
  { label: 'Membaca dialog dan konteks', after: 0 },
  { label: 'Memecah dialog menjadi unit tuturan', after: 6 },
  { label: 'Mengklasifikasikan tindak ilokusi Searle', after: 25 },
  { label: 'Menilai felicity conditions', after: 45 },
  { label: 'Menyusun kesimpulan dan menyimpan hasil', after: 70 },
]

export function AnalysisProgress({ utteranceEstimate, slowModel = false }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  const activeIndex = STEPS.reduce((index, step, i) => (seconds >= step.after ? i : index), 0)
  const minutes = Math.floor(seconds / 60)
  const rest = String(seconds % 60).padStart(2, '0')

  return (
    <div className="analysis-progress" role="dialog" aria-modal="true" aria-labelledby="progress-title">
      <div className="analysis-progress-card">
        <h2 id="progress-title">AI sedang menganalisis</h2>
        <p>
          {slowModel ? 'Model gratis biasanya butuh 1–4 menit' : 'Biasanya 30 detik sampai 3 menit'}
          {utteranceEstimate ? `, tergantung panjang dialog (sekitar ${utteranceEstimate} baris)` : ''}. Jangan tutup halaman ini.
        </p>
        <ol className="progress-steps">
          {STEPS.map((step, i) => {
            const status = i < activeIndex ? 'done' : i === activeIndex ? 'active' : ''
            return (
              <li key={step.label} className={`progress-step ${status}`}>
                <span className="step-icon" aria-hidden="true">
                  {status === 'done' ? <Check size={15} /> : status === 'active' ? <Spinner small /> : i + 1}
                </span>
                {step.label}
              </li>
            )
          })}
        </ol>
        <div className="progress-elapsed" aria-live="polite">
          Waktu berjalan {minutes}:{rest}
        </div>
      </div>
    </div>
  )
}
