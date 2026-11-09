import { useState } from 'react'
import { Link } from 'react-router'
import { Alert, Spinner } from '../components/Feedback.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { supabase } from '../lib/supabase.js'
import { toFriendlyMessage } from '../utils/errors.js'

export default function ForgotPasswordPage() {
  useDocumentTitle('Lupa kata sandi')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/profil?ubah-sandi=1`,
    })
    setSubmitting(false)
    if (resetError) {
      setError(toFriendlyMessage(resetError, 'Gagal mengirim email. Silakan coba lagi.'))
      return
    }
    setSent(true)
  }

  return (
    <>
      <h1>Atur ulang kata sandi</h1>
      <p>Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat kata sandi baru.</p>

      {sent ? (
        <Alert type="success" title="Email terkirim">
          Jika email tersebut terdaftar, tautan atur ulang kata sandi sudah dikirim. Buka tautan itu, lalu buat kata sandi baru di halaman profil.
        </Alert>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          {error && <Alert type="error">{error}</Alert>}
          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !email.trim()}>
            {submitting && <Spinner small />}
            Kirim tautan
          </button>
        </form>
      )}

      <p className="auth-switch">
        <Link to="/login">Kembali ke halaman login</Link>
      </p>
    </>
  )
}
