import { KeyRound, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Alert, Spinner } from '../components/Feedback.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { changePassword, updateOwnProfile } from '../services/profileService.js'
import { toFriendlyMessage } from '../utils/errors.js'
import { formatDate } from '../utils/format.js'

const MIN_PASSWORD = 8

export default function ProfilePage() {
  useDocumentTitle('Profil')
  const { profile, user, isAdmin, refreshProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const resetMode = searchParams.get('ubah-sandi') === '1'

  const [form, setForm] = useState({ fullName: profile?.full_name ?? '', institution: profile?.institution ?? '' })
  const [saving, setSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState(null)

  const [passwords, setPasswords] = useState({ next: '', confirm: '' })
  const [changing, setChanging] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)

  useEffect(() => {
    if (resetMode) document.getElementById('password-section')?.scrollIntoView({ behavior: 'smooth' })
  }, [resetMode])

  async function saveProfile(event) {
    event.preventDefault()
    if (form.fullName.trim().length < 2) {
      setProfileMessage({ type: 'error', text: 'Nama lengkap minimal 2 karakter.' })
      return
    }
    setSaving(true)
    setProfileMessage(null)
    try {
      await updateOwnProfile(user.id, form)
      await refreshProfile()
      setProfileMessage({ type: 'success', text: 'Profil tersimpan.' })
    } catch (error) {
      setProfileMessage({ type: 'error', text: toFriendlyMessage(error, 'Gagal menyimpan profil.') })
    } finally {
      setSaving(false)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    if (passwords.next.length < MIN_PASSWORD) {
      setPasswordMessage({ type: 'error', text: `Kata sandi minimal ${MIN_PASSWORD} karakter.` })
      return
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak sama.' })
      return
    }
    setChanging(true)
    setPasswordMessage(null)
    try {
      await changePassword(passwords.next)
      setPasswords({ next: '', confirm: '' })
      setPasswordMessage({ type: 'success', text: 'Kata sandi berhasil diubah.' })
    } catch (error) {
      setPasswordMessage({ type: 'error', text: toFriendlyMessage(error, 'Gagal mengubah kata sandi.') })
    } finally {
      setChanging(false)
    }
  }

  return (
    <>
      <PageHeader title="Profil pengguna" description="Kelola data diri dan kata sandi akun Anda." />

      <div className="grid-2">
        <section className="panel">
          <div className="panel-header">
            <h2 className="row" style={{ gap: 8 }}>
              <UserRound size={20} color="#2f5bd3" aria-hidden="true" />
              Data diri
            </h2>
          </div>

          <dl className="kv-grid" style={{ marginBottom: 20 }}>
            <div className="kv">
              <dt>Email</dt>
              <dd style={{ wordBreak: 'break-all' }}>{user?.email}</dd>
            </div>
            <div className="kv">
              <dt>Role</dt>
              <dd>
                <span className={`badge ${isAdmin ? 'badge-navy' : 'badge-info'}`}>{isAdmin ? 'Admin' : 'Pengguna'}</span>
              </dd>
            </div>
            <div className="kv kv-full" style={{ borderBottom: 0 }}>
              <dt>Terdaftar sejak</dt>
              <dd>{formatDate(profile?.created_at)}</dd>
            </div>
          </dl>

          <form className="form-grid" onSubmit={saveProfile}>
            {profileMessage && <Alert type={profileMessage.type}>{profileMessage.text}</Alert>}
            <div className="field">
              <label className="label" htmlFor="fullName">
                Nama lengkap
              </label>
              <input id="fullName" className="input" maxLength={120} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label" htmlFor="institution">
                Institusi <span className="label-optional">(opsional)</span>
              </label>
              <input id="institution" className="input" maxLength={160} value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} />
            </div>
            <p className="small muted">Role hanya dapat diubah oleh admin.</p>
            <div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <Spinner small />}
                Simpan profil
              </button>
            </div>
          </form>
        </section>

        <section className="panel" id="password-section">
          <div className="panel-header">
            <h2 className="row" style={{ gap: 8 }}>
              <KeyRound size={20} color="#2f5bd3" aria-hidden="true" />
              Ubah kata sandi
            </h2>
          </div>
          <form className="form-grid" onSubmit={savePassword}>
            {resetMode && !passwordMessage && <Alert type="info">Buat kata sandi baru untuk akun Anda.</Alert>}
            {passwordMessage && <Alert type={passwordMessage.type}>{passwordMessage.text}</Alert>}
            <div className="field">
              <label className="label" htmlFor="newPassword">
                Kata sandi baru
              </label>
              <input
                id="newPassword"
                type="password"
                className="input"
                autoComplete="new-password"
                value={passwords.next}
                onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              />
              <span className="hint">Minimal {MIN_PASSWORD} karakter.</span>
            </div>
            <div className="field">
              <label className="label" htmlFor="confirmPassword">
                Ulangi kata sandi baru
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              />
            </div>
            <div>
              <button type="submit" className="btn btn-primary" disabled={changing || !passwords.next}>
                {changing && <Spinner small />}
                Ubah kata sandi
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
