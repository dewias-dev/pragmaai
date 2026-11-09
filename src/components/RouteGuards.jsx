import { ShieldAlert } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth.js'
import { toFriendlyMessage } from '../utils/errors.js'
import { Alert, EmptyState, PageLoading } from './Feedback.jsx'

/** Halaman yang hanya boleh dibuka setelah login. */
export function ProtectedRoute() {
  const { session, loading, profileStatus, profileError, refreshProfile, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoading label="Memeriksa sesi login…" fullscreen />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />

  if (profileStatus === 'missing' || profileStatus === 'error') {
    return (
      <div className="content" style={{ margin: '10vh auto', maxWidth: 620 }}>
        <Alert type="error" title="Profil pengguna tidak dapat dimuat">
          {profileStatus === 'missing'
            ? 'Akun Anda belum memiliki profil. Pastikan file supabase/schema.sql sudah dijalankan di Supabase, lalu muat ulang halaman.'
            : toFriendlyMessage(profileError, 'Terjadi kesalahan saat membaca profil.')}
          <div className="row mt-16">
            <button type="button" className="btn btn-primary btn-sm" onClick={refreshProfile}>
              Coba lagi
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={signOut}>
              Logout
            </button>
          </div>
        </Alert>
      </div>
    )
  }

  return <Outlet />
}

/** Halaman khusus admin. Database (RLS) tetap menjadi penjaga utama. */
export function AdminRoute() {
  const { isAdmin } = useAuth()
  if (!isAdmin) {
    return (
      <div className="panel">
        <EmptyState
          icon={ShieldAlert}
          title="Halaman khusus admin"
          action={
            <Link to="/" className="btn btn-secondary">
              Kembali ke dashboard
            </Link>
          }
        >
          Akun Anda tidak memiliki akses ke halaman ini. Hubungi admin jika Anda memerlukan akses.
        </EmptyState>
      </div>
    )
  }
  return <Outlet />
}

/** Halaman login/register: jika sudah login, langsung ke dashboard. */
export function GuestOnlyRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoading fullscreen />
  if (session) return <Navigate to={location.state?.from || '/'} replace />
  return <Outlet />
}
