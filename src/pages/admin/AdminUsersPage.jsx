import { Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx'
import { Alert, PageLoading } from '../../components/Feedback.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { listUsers, setUserRole } from '../../services/adminService.js'
import { toFriendlyMessage } from '../../utils/errors.js'
import { formatDate, formatNumber } from '../../utils/format.js'

export default function AdminUsersPage() {
  useDocumentTitle('Kelola pengguna')
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(
    () =>
      listUsers()
        .then((data) => {
          setUsers(data)
          setStatus({ loading: false, error: '' })
        })
        .catch((error) => setStatus({ loading: false, error: toFriendlyMessage(error, 'Gagal memuat daftar pengguna.') })),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return users
    return users.filter((u) => `${u.full_name} ${u.email} ${u.institution}`.toLowerCase().includes(term))
  }, [users, query])

  async function confirmRoleChange() {
    setSaving(true)
    try {
      await setUserRole(pending.user.id, pending.role)
      setNotice(`Role ${pending.user.full_name || pending.user.email} diubah menjadi ${pending.role === 'admin' ? 'Admin' : 'Pengguna'}.`)
      setPending(null)
      await load()
    } catch (error) {
      setStatus((prev) => ({ ...prev, error: toFriendlyMessage(error, 'Gagal mengubah role.') }))
      setPending(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Kelola pengguna" description="Lihat pengguna terdaftar dan atur siapa yang menjadi admin." />

      <div className="stack">
        {notice && <Alert type="success">{notice}</Alert>}
        {status.error && <Alert type="error">{status.error}</Alert>}
        <Alert type="info">
          Admin dapat mengelola materi, meninjau umpan balik, dan mengatur role. Admin tidak dapat membuka isi analisis milik pengguna lain, dan tidak dapat
          mengubah role dirinya sendiri.
        </Alert>

        <section className="panel">
          <div className="toolbar">
            <div className="search-box">
              <Search size={17} aria-hidden="true" />
              <label className="visually-hidden" htmlFor="user-search">
                Cari pengguna
              </label>
              <input id="user-search" type="search" className="input" placeholder="Cari nama, email, atau institusi" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <span className="small muted">{formatNumber(filtered.length)} pengguna</span>
          </div>

          {status.loading ? (
            <PageLoading label="Memuat pengguna…" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Institusi</th>
                    <th className="num">Analisis</th>
                    <th>Terdaftar</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isSelf = u.id === user.id
                    return (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.full_name || '(tanpa nama)'}</strong>
                          {isSelf && <span className="badge badge-info" style={{ marginLeft: 6 }}>Anda</span>}
                          <div className="small faint">{u.email}</div>
                        </td>
                        <td>{u.institution || <span className="faint">-</span>}</td>
                        <td className="num">{formatNumber(u.analyses_count)}</td>
                        <td className="nowrap">{formatDate(u.created_at)}</td>
                        <td>
                          <label className="visually-hidden" htmlFor={`role-${u.id}`}>
                            Role {u.full_name || u.email}
                          </label>
                          <select
                            id={`role-${u.id}`}
                            className="select"
                            style={{ minWidth: 130 }}
                            value={u.role}
                            disabled={isSelf}
                            title={isSelf ? 'Anda tidak dapat mengubah role sendiri' : undefined}
                            onChange={(e) => setPending({ user: u, role: e.target.value })}
                          >
                            <option value="user">Pengguna</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Ubah role pengguna?"
        danger={false}
        confirmLabel="Ubah role"
        busy={saving}
        onCancel={() => setPending(null)}
        onConfirm={confirmRoleChange}
      >
        {pending && (
          <>
            {pending.user.full_name || pending.user.email} akan menjadi <strong>{pending.role === 'admin' ? 'Admin' : 'Pengguna'}</strong>.
            {pending.role === 'admin' && ' Admin dapat mengelola materi, pengguna, dan umpan balik.'}
          </>
        )}
      </ConfirmDialog>
    </>
  )
}
