import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

export function PageHeader({ title, description, actions, backTo, backLabel = 'Kembali', children }) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        {backTo && (
          <Link to={backTo} className="back-link no-print">
            <ArrowLeft size={16} aria-hidden="true" />
            {backLabel}
          </Link>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </div>
      {actions && <div className="page-header-actions no-print">{actions}</div>}
    </header>
  )
}
