import { ChevronDown, ChevronUp, Flag, TriangleAlert } from 'lucide-react'
import {
  CATEGORIES,
  CONFIDENCE_LEVELS,
  DIRECTION_OF_FIT,
  FELICITY_KEYS,
  FELICITY_STATUS,
  SPEECH_ACT_TYPES,
  categoryLabel,
} from '../../shared/searle.js'
import { CategoryBadge } from './CategoryBadge.jsx'

const toList = (value) => (Array.isArray(value) ? value.filter(Boolean) : [])

function ListOrDash({ items }) {
  const list = toList(items)
  if (!list.length) return <span className="faint">Tidak ada</span>
  return (
    <ul>
      {list.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

const CONFIDENCE_TONE = { tinggi: 'badge-success', sedang: 'badge-info', rendah: 'badge-warning' }

/**
 * Satu tuturan sebagai contoh bernomor, beserta detail analisis Searle-nya.
 * Detail selalu ada di halaman (hanya disembunyikan) supaya ikut tercetak.
 */
export function UtteranceCard({ utterance: u, expanded, onToggle, highlighted, onReport, reported }) {
  const felicity = u.felicity_conditions || {}
  const bodyId = `utterance-body-${u.id}`
  const fit = DIRECTION_OF_FIT[u.direction_of_fit] ?? DIRECTION_OF_FIT.undetermined

  return (
    <article id={`tuturan-${u.utterance_number}`} className={`utterance-card ${highlighted ? 'highlight' : ''}`}>
      <div className="utterance-head">
        <div className="example">
          <span className="example-no">({u.utterance_number})</span>
          <span className="example-speaker">
            <strong>{u.speaker}</strong> kepada {u.addressee}
          </span>
          <p className="example-text">“{u.utterance_text}”</p>
        </div>
        <div className="utterance-meta">
          <CategoryBadge category={u.category} />
          <span className="badge">{SPEECH_ACT_TYPES[u.speech_act_type]?.label ?? '-'}</span>
          <span className={`badge ${CONFIDENCE_TONE[u.confidence] ?? ''}`}>Keyakinan {CONFIDENCE_LEVELS[u.confidence]?.label.toLowerCase()}</span>
          {!u.quote_verified && (
            <span className="badge badge-warning" title="Teks tuturan tidak ditemukan persis sama di dialog asli">
              <TriangleAlert size={13} aria-hidden="true" />
              Kutipan perlu dicek
            </span>
          )}
        </div>
      </div>

      <button type="button" className="utterance-toggle" aria-expanded={expanded} aria-controls={bodyId} onClick={onToggle}>
        {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        {expanded ? 'Sembunyikan analisis' : `Lihat analisis: ${u.specific_act || categoryLabel(u.category)}`}
      </button>

      <div id={bodyId} className="utterance-body" hidden={!expanded}>
        {u.classification_note && (
          <div className={`alert ${u.category === 'undetermined' ? 'alert-warning' : 'alert-info'}`} style={{ marginBottom: 16 }}>
            <TriangleAlert size={18} aria-hidden="true" />
            <div>
              <div className="alert-title">{u.category === 'undetermined' ? 'Klasifikasi belum dapat dipastikan' : 'Catatan klasifikasi'}</div>
              {u.classification_note}
            </div>
          </div>
        )}

        <dl className="kv-grid">
          <div className="kv">
            <dt>Kategori ilokusi</dt>
            <dd>
              {categoryLabel(u.category)} <span className="faint">({CATEGORIES[u.category]?.english})</span>
            </dd>
          </div>
          <div className="kv">
            <dt>Tindak ilokusi spesifik</dt>
            <dd>{u.specific_act || '-'}</dd>
          </div>
          <div className="kv">
            <dt>Illocutionary point</dt>
            <dd>{u.illocutionary_point || '-'}</dd>
          </div>
          <div className="kv">
            <dt>Propositional content</dt>
            <dd>{u.propositional_content || '-'}</dd>
          </div>
          <div className="kv">
            <dt>Formula F(p)</dt>
            <dd className="formula">{u.fp_formula || '-'}</dd>
          </div>
          <div className="kv">
            <dt>Direction of fit</dt>
            <dd>
              <span className="serif" aria-hidden="true">
                {fit.symbol}
              </span>{' '}
              {fit.label}
            </dd>
          </div>
          <div className="kv">
            <dt>Illocutionary Force Indicating Devices (IFIDs)</dt>
            <dd>
              <ListOrDash items={u.ifids} />
            </dd>
          </div>
          <div className="kv">
            <dt>Bukti linguistik</dt>
            <dd>
              <ListOrDash items={u.linguistic_evidence} />
            </dd>
          </div>
          <div className="kv">
            <dt>Psychological state (expressed sincerity condition)</dt>
            <dd>{u.psychological_state || '-'}</dd>
          </div>
          <div className="kv">
            <dt>Langsung atau tidak langsung</dt>
            <dd>
              {SPEECH_ACT_TYPES[u.speech_act_type]?.label} <span className="faint">({SPEECH_ACT_TYPES[u.speech_act_type]?.english})</span>
              {u.literal_force && <div className="small muted mt-8">Ilokusi literal: {u.literal_force}</div>}
            </dd>
          </div>
          <div className="kv kv-full" style={{ borderBottom: 0 }}>
            <dt>Kategori alternatif</dt>
            <dd>{u.alternative_category && u.alternative_category !== 'tidak_ada' ? categoryLabel(u.alternative_category) : 'Tidak ada'}</dd>
          </div>
        </dl>

        <h3 className="subheading">Felicity conditions</h3>
        <div className="felicity-list">
          {FELICITY_KEYS.map(({ key, label }) => {
            const item = felicity[key] ?? { status: 'tidak_dapat_dinilai', explanation: 'Informasi tidak cukup.' }
            const status = FELICITY_STATUS[item.status] ?? FELICITY_STATUS.tidak_dapat_dinilai
            const tone = status.tone === 'success' ? 'badge-success' : status.tone === 'danger' ? 'badge-danger' : ''
            return (
              <div key={key} className="felicity-item">
                <div className="felicity-name">
                  {label}
                  <div>
                    <span className={`badge ${tone}`}>{status.label}</span>
                  </div>
                </div>
                <p>{item.explanation}</p>
              </div>
            )
          })}
        </div>

        <h3 className="subheading">Penjelasan</h3>
        <div className="explanations">
          <div className="explanation">
            <h4>Analisis akademik</h4>
            <p>{u.academic_explanation || '-'}</p>
          </div>
          <div className="explanation explanation-simple">
            <h4>Penjelasan sederhana</h4>
            <p>{u.simple_explanation || '-'}</p>
          </div>
        </div>

        <div className="row mt-16 no-print">
          {reported ? (
            <span className="small muted">Umpan balik untuk tuturan ini sudah dikirim.</span>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onReport(u)}>
              <Flag size={15} aria-hidden="true" />
              Laporkan klasifikasi keliru
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
