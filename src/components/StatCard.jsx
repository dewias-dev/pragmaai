/**
 * Kartu statistik: chip ikon berwarna pastel, label kecil, angka tebal.
 * tone: coral | amber | green | violet | sky
 */
export function StatCard({ icon: Icon, label, value, note, tone = 'sky', textValue = false }) {
  return (
    <div className="stat">
      {Icon && (
        <span className={`stat-icon tone-${tone}`} aria-hidden="true">
          <Icon size={20} />
        </span>
      )}
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${textValue ? 'stat-value-text' : ''}`}>{value}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  )
}
