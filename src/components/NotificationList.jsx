import { BellRing, ChevronRight, CircleCheck, FileText } from 'lucide-react'
import { Link } from 'react-router'
import { Spinner } from './Feedback.jsx'

const ICONS = { alert: BellRing, check: CircleCheck, file: FileText }

/** Daftar notifikasi berbentuk kartu kecil dengan ikon berwarna. */
export function NotificationList({ items, loading, onNavigate }) {
  if (loading) {
    return (
      <div className="notification-empty row">
        <Spinner small /> Memuat notifikasi…
      </div>
    )
  }
  if (!items.length) {
    return <div className="notification-empty">Belum ada notifikasi. Hasil analisis dan tanggapan admin akan muncul di sini.</div>
  }
  return (
    <ul className="notification-list">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? FileText
        return (
          <li key={item.id}>
            <Link to={item.to} className="notification" onClick={onNavigate}>
              <span className={`notification-icon tone-${item.tone}`} aria-hidden="true">
                <Icon size={18} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="notification-title">{item.title}</span>
                <span className="notification-detail" style={{ display: 'block' }}>
                  {item.detail}
                </span>
              </span>
              <ChevronRight size={16} className="notification-chevron" aria-hidden="true" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
