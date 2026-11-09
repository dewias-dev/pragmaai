/**
 * Maskot PragmaAI: balon percakapan yang sedang meneliti tuturan dengan kaca pembesar.
 * Simbol kecil di sekitarnya mewakili daya ilokusi: ! (direktif), ? (bertanya),
 * ✓ (asertif), dan hati (ekspresif). Digambar sebagai SVG orisinal.
 */
export function Mascot({ title = 'Maskot PragmaAI' }) {
  const ink = '#1d2848'
  return (
    <svg viewBox="0 0 260 230" role="img" aria-label={title}>
      {/* bayangan */}
      <ellipse cx="128" cy="214" rx="76" ry="9" fill="#e4e9f7" />

      {/* simbol melayang */}
      <circle cx="40" cy="58" r="17" fill="#fff1cc" />
      <text x="40" y="65" textAnchor="middle" fontSize="20" fontWeight="800" fill="#f2a01e" fontFamily="inherit">
        !
      </text>
      <circle cx="222" cy="40" r="15" fill="#e1e9fd" />
      <text x="222" y="46" textAnchor="middle" fontSize="17" fontWeight="800" fill="#3a66e8" fontFamily="inherit">
        ?
      </text>
      <circle cx="30" cy="150" r="12" fill="#ffe1e8" />
      <path d="M30 156 l-6-6 a3.6 3.6 0 0 1 6-4 a3.6 3.6 0 0 1 6 4 z" fill="#f2557a" />
      <circle cx="236" cy="170" r="12" fill="#d9f4e8" />
      <path d="M230 170 l4 4 l7-8" fill="none" stroke="#1fae78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* kilau */}
      <path d="M190 18 l3 7 l7 3 l-7 3 l-3 7 l-3-7 l-7-3 l7-3 z" fill="#ffc94d" />
      <path d="M70 22 l2 5 l5 2 l-5 2 l-2 5 l-2-5 l-5-2 l5-2 z" fill="#a9bdf8" />

      {/* kaki */}
      <ellipse cx="140" cy="190" rx="14" ry="8.5" fill="#fff" stroke={ink} strokeWidth="3.5" />
      <ellipse cx="174" cy="186" rx="14" ry="8.5" fill="#fff" stroke={ink} strokeWidth="3.5" />

      {/* tangan kiri melambai */}
      <path d="M66 126 q-20 -2 -24 -22" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="41" cy="101" r="6" fill="#fff" stroke={ink} strokeWidth="3.5" />

      {/* badan: balon percakapan */}
      <path
        d="M112 52 H158 A52 52 0 0 1 210 104 V126 A52 52 0 0 1 158 178 H130 L98 202 L104 174 A52 52 0 0 1 60 126 V104 A52 52 0 0 1 112 52 Z"
        fill="#fff"
        stroke={ink}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* mata tersenyum, pipi, mulut */}
      <path d="M106 112 q9 -10 18 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M146 112 q9 -10 18 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="102" cy="128" rx="9" ry="5.5" fill="#ffc2d0" />
      <ellipse cx="168" cy="128" rx="9" ry="5.5" fill="#ffc2d0" />
      <path d="M127 126 q8 9 16 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />

      {/* tangan kanan memegang kaca pembesar */}
      <path d="M206 134 q14 4 20 -6" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="238" y1="122" x2="250" y2="136" stroke="#f2a01e" strokeWidth="7" strokeLinecap="round" />
      <circle cx="228" cy="110" r="17" fill="#e8efff" stroke={ink} strokeWidth="3.5" />
      <path d="M220 104 q5 -6 12 -4" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}
