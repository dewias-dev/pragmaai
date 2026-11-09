import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './components/AuthProvider.jsx'
import { AdminRoute, GuestOnlyRoute, ProtectedRoute } from './components/RouteGuards.jsx'
import { AppLayout } from './layouts/AppLayout.jsx'
import { AuthLayout } from './layouts/AuthLayout.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage.jsx'
import AdminKnowledgePage from './pages/admin/AdminKnowledgePage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import AnalysisResultPage from './pages/AnalysisResultPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import KnowledgeArticlePage from './pages/KnowledgeArticlePage.jsx'
import KnowledgeBasePage from './pages/KnowledgeBasePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NewAnalysisPage from './pages/NewAnalysisPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import SetupRequiredPage from './pages/SetupRequiredPage.jsx'

/**
 * Peta halaman aplikasi.
 *  - Halaman tamu: login, register, lupa sandi
 *  - Halaman pengguna (wajib login): dashboard, analisis, riwayat, materi, profil
 *  - Halaman admin (wajib role admin): kelola materi, pengguna, umpan balik
 */
export default function App() {
  if (!isSupabaseConfigured) return <SetupRequiredPage />

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestOnlyRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/lupa-sandi" element={<ForgotPasswordPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/analisis/baru" element={<NewAnalysisPage />} />
              <Route path="/analisis/:id" element={<AnalysisResultPage />} />
              <Route path="/riwayat" element={<HistoryPage />} />
              <Route path="/materi" element={<KnowledgeBasePage />} />
              <Route path="/materi/:slug" element={<KnowledgeArticlePage />} />
              <Route path="/profil" element={<ProfilePage />} />

              <Route path="/admin" element={<AdminRoute />}>
                <Route path="materi" element={<AdminKnowledgePage />} />
                <Route path="pengguna" element={<AdminUsersPage />} />
                <Route path="umpan-balik" element={<AdminFeedbackPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
