import { Brand } from '../components/Logo.jsx'

/**
 * Ditampilkan bila VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY belum diisi,
 * supaya pemula tahu langkah yang kurang alih-alih melihat layar kosong.
 */
export default function SetupRequiredPage() {
  return (
    <div className="auth-main" style={{ minHeight: '100vh' }}>
      <div className="auth-card" style={{ width: 'min(620px, 100%)' }}>
        <div className="row" style={{ marginBottom: 28, color: 'var(--navy-800)' }}>
          <Brand />
        </div>
        <h1>Konfigurasi belum lengkap</h1>
        <p className="muted mt-8">Aplikasi belum dapat terhubung ke Supabase. Ikuti langkah berikut:</p>
        <ol className="mt-16" style={{ paddingLeft: 20, display: 'grid', gap: 10 }}>
          <li>
            Di folder proyek, salin <code>.env.example</code> menjadi <code>.env.local</code>:
            <pre className="panel" style={{ margin: '8px 0 0', padding: 12, overflowX: 'auto' }}>Copy-Item .env.example .env.local</pre>
          </li>
          <li>
            Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> dari Supabase (Project Settings, bagian API Keys).
          </li>
          <li>
            Hentikan server dengan <kbd>Ctrl</kbd> + <kbd>C</kbd>, lalu jalankan lagi <code>npm run dev</code>.
          </li>
        </ol>
        <p className="small muted mt-24">
          Jika aplikasi sudah di-deploy, isi variabel yang sama di Vercel (Project Settings, bagian Environment Variables), lalu lakukan Redeploy.
        </p>
      </div>
    </div>
  )
}
