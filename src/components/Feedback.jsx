import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'

const ICONS = { info: Info, error: AlertCircle, success: CheckCircle2, warning: TriangleAlert }

/** Kotak pesan: info, error, success, warning. */
export function Alert({ type = 'info', title, children, className = '' }) {
  const Icon = ICONS[type] ?? Info
  return (
    <div className={`alert alert-${type} ${className}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <div>
        {title && <div className="alert-title">{title}</div>}
        {children}
      </div>
    </div>
  )
}

export function Spinner({ small = false, label }) {
  return <span className={`spinner ${small ? 'spinner-sm' : ''}`} role="status" aria-label={label || 'Memuat'} />
}

export function PageLoading({ label = 'Memuat data…', fullscreen = false }) {
  return (
    <div className={`page-loading ${fullscreen ? 'fullscreen' : ''}`}>
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={44} strokeWidth={1.5} aria-hidden="true" />}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}
