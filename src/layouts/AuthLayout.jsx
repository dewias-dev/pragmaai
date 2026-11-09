import { Outlet } from 'react-router'
import { Brand } from '../components/Logo.jsx'
import { Mascot } from '../components/Mascot.jsx'

/**
 * Kerangka halaman login/register.
 * Sisi kiri menampilkan maskot dan contoh singkat analisis Searle.
 */
export function AuthLayout() {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-brand">
          <Brand />
        </div>

        <div className="auth-illustration">
          <Mascot />
        </div>

        <figure className="auth-example" style={{ margin: 0 }}>
          <p className="auth-quote-example">
            <span className="ex-no">(1)</span>
            “Bisa kamu kerjakan malam ini?”
          </p>
          <dl className="auth-quote-analysis">
            <div>
              <dt>Kategori</dt>
              <dd>Direktif (! ↑ W)</dd>
            </div>
            <div>
              <dt>Tindak ilokusi</dt>
              <dd>Meminta, secara tidak langsung</dd>
            </div>
            <div>
              <dt>Bentuk literal</dt>
              <dd>Pertanyaan tentang kemampuan</dd>
            </div>
          </dl>
        </figure>

        <p className="auth-aside-foot">Analisis tindak tutur ilokusi berdasarkan teori John R. Searle.</p>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <Brand size={34} />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
