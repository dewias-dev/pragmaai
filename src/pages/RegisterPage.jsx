import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Alert, Spinner } from '../components/Feedback.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { supabase } from '../lib/supabase.js'
import { toFriendlyMessage } from '../utils/errors.js'

const MIN_PASSWORD = 8

export default function RegisterPage() {
  useDocumentTitle('Daftar akun')
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', institution: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  function validate() {
    const next = {}
    if (form.fullName.trim().length < 2) next.fullName = 'Isi nama lengkap Anda.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Format email tidak valid.'
    if (form.password.length < MIN_PASSWORD) next.password = `Kata sandi minimal ${MIN_PASSWORD} karakter.`
    if (form.confirm !== form.password) next.confirm = 'Konfirmasi kata sandi tidak sama.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerError('')
    if (!validate()) return

    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        // Data ini disalin ke tabel profiles oleh trigger database. Role selalu "user".
        data: { full_name: form.fullName.trim(), institution: form.institution.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    setSubmitting(false)

    if (error) {
      setServerError(toFriendlyMessage(error, 'Pendaftaran gagal. Silakan coba lagi.'))
      return
    }
    if (data.session) {
      navigate('/', { replace: true })
    } else {
      setNeedsConfirmation(true)
    }
  }

  if (needsConfirmation) {
    return (
      <>
        <MailCheck size={40} strokeWidth={1.5} color="#2f5bd3" aria-hidden="true" />
        <h1 className="mt-16">Cek email Anda</h1>
        <p>
          Kami mengirim tautan konfirmasi ke <strong>{form.email}</strong>. Buka tautan itu, lalu login ke PragmaAI.
        </p>
        <Link to="/login" className="btn btn-primary btn-block">
          Ke halaman login
        </Link>
      </>
    )
  }

  const fieldProps = (key) => ({
    id: key,
    className: 'input',
    value: form[key],
    onChange: update(key),
    'aria-invalid': errors[key] ? 'true' : undefined,
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
  })

  return (
    <>
      <h1>Buat akun</h1>
      <p>Akun baru terdaftar sebagai pengguna. Akses admin diberikan oleh admin.</p>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        {serverError && <Alert type="error">{serverError}</Alert>}

        <div className="field">
          <label className="label" htmlFor="fullName">
            Nama lengkap
          </label>
          <input {...fieldProps('fullName')} autoComplete="name" maxLength={120} />
          {errors.fullName && <span id="fullName-error" className="field-error">{errors.fullName}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="institution">
            Institusi <span className="label-optional">(opsional)</span>
          </label>
          <input {...fieldProps('institution')} autoComplete="organization" maxLength={160} placeholder="Misalnya: Universitas Pendidikan Indonesia" />
        </div>

        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input {...fieldProps('email')} type="email" autoComplete="email" />
          {errors.email && <span id="email-error" className="field-error">{errors.email}</span>}
        </div>

        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="password">
              Kata sandi
            </label>
            <input {...fieldProps('password')} type="password" autoComplete="new-password" />
            {errors.password ? (
              <span id="password-error" className="field-error">{errors.password}</span>
            ) : (
              <span className="hint">Minimal {MIN_PASSWORD} karakter.</span>
            )}
          </div>
          <div className="field">
            <label className="label" htmlFor="confirm">
              Ulangi kata sandi
            </label>
            <input {...fieldProps('confirm')} type="password" autoComplete="new-password" />
            {errors.confirm && <span id="confirm-error" className="field-error">{errors.confirm}</span>}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting && <Spinner small />}
          Daftar
        </button>
      </form>

      <p className="auth-switch">
        Sudah punya akun? <Link to="/login">Masuk</Link>
      </p>
    </>
  )
}
