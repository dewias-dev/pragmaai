/**
 * Logo PragmaAI: balon percakapan dengan dua arah kesesuaian Searle
 * (kata ke dunia ↓ dan dunia ke kata ↑).
 */
export function LogoMark({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#3a66e8" />
      <path
        d="M15 17h34a5 5 0 0 1 5 5v16a5 5 0 0 1-5 5H30l-9 8v-8h-6a5 5 0 0 1-5-5V22a5 5 0 0 1 5-5z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M24 26v8M24 26l-4 4M24 26l4 4" stroke="#cfdcff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M40 34v-8M40 34l-4-4M40 34l4-4" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function Brand({ size = 38, showTagline = true }) {
  return (
    <>
      <LogoMark size={size} />
      <span>
        <span className="brand-name">PRAGMAAI</span>
        {showTagline && <span className="brand-tagline">Intelligent Pragmatic Speech Act Analysis</span>}
      </span>
    </>
  )
}
