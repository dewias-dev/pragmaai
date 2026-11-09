import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Alert, Spinner } from '../components/Feedback.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { supabase } from '../lib/supabase.js'
import { toFriendlyMessage } from '../utils/errors.js'

export default function LoginPage() {
  useDocumentTitle('Login')
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setSubmitting(false)
    if (signInError) {
      setError(toFriendlyMessage(signInError, 'Login gagal. Silakan coba lagi.'))
      return
    }
    navigate(location.state?.from || '/', { replace: true })
  }

  return (
    <>
      <h1>Masuk ke PragmaAI</h1>
      <p>Lanjutkan analisis tindak tutur Anda.</p>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        {error && <Alert type="error">{error}</Alert>}

        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="input" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="field">
          <div className="row-between">
            <label className="label" htmlFor="password">
              Kata sandi
            </label>
            <Link to="/lupa-sandi" className="small">
              Lupa kata sandi?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="input"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !email || !password}>
          {submitting && <Spinner small />}
          Masuk
        </button>
      </form>

      <p className="auth-switch">
        Belum punya akun? <Link to="/register">Daftar sekarang</Link>
      </p>
    </>
  )
}
