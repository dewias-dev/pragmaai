import {
  Bell,
  BookOpenText,
  CalendarDays,
  FilePlus2,
  Files,
  History,
  LibraryBig,
  MessagesSquare,
  ShieldCheck,
  Shuffle,
  Sigma,
  UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ALL_CATEGORY_KEYS, CATEGORIES } from '../../shared/searle.js'
import { percentOf } from '../../shared/stats.js'
import { DominantCategories } from '../components/CategoryBadge.jsx'
import { CategoryDistributionChart, DistributionTable, MonthlyAnalysesChart } from '../components/Charts.jsx'
import { Alert, EmptyState, PageLoading } from '../components/Feedback.jsx'
import { Mascot } from '../components/Mascot.jsx'
import { NotificationList } from '../components/NotificationList.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { StatCard } from '../components/StatCard.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useNotifications } from '../hooks/useNotifications.js'
import { getAdminOverview } from '../services/adminService.js'
import { getMyStats, listRecentAnalyses } from '../services/analysisService.js'
import { toFriendlyMessage } from '../utils/errors.js'
import { formatDateTime, formatNumber, formatPercent, lastMonthKeys } from '../utils/format.js'

/** Mengubah objek {kategori: jumlah} menjadi baris lengkap dengan persentase. */
function toRows(counts = {}) {
  const values = ALL_CATEGORY_KEYS.map((key) => Number(counts[key] ?? 0))
  const total = values.reduce((sum, n) => sum + n, 0)
  return ALL_CATEGORY_KEYS.map((key, i) => ({ key, count: values[i], percentage: percentOf(values[i], total) }))
}

function dominantOf(rows) {
  const scored = rows.filter((r) => r.key !== 'undetermined')
  const max = Math.max(0, ...scored.map((r) => r.count))
  return max > 0 ? scored.filter((r) => r.count === max).map((r) => r.key) : []
}

/** Kartu sapaan dengan pintasan ke halaman yang paling sering dipakai. */
function HeroCard({ firstName, isAdmin }) {
  const shortcuts = [
    { to: '/analisis/baru', label: 'Mulai analisis baru', icon: FilePlus2, tone: 'sky' },
    { to: '/riwayat', label: 'Riwayat analisis', icon: History, tone: 'amber' },
    { to: '/materi', label: 'Pelajari teori Searle', icon: BookOpenText, tone: 'coral' },
    isAdmin
      ? { to: '/admin/materi', label: 'Kelola materi', icon: LibraryBig, tone: 'violet' }
      : { to: '/profil', label: 'Profil saya', icon: UserRound, tone: 'violet' },
  ]
  return (
    <section className="hero-card" aria-label="Sapaan">
      <div>
        <h1>Hai, {firstName || 'Peneliti'}!</h1>
        <p>Apa yang ingin Anda analisis hari ini?</p>
        <ul className="shortcuts">
          {shortcuts.map(({ to, label, icon: Icon, tone }) => (
            <li key={to}>
              <Link to={to} className="shortcut">
                <span className={`shortcut-icon tone-${tone}`} aria-hidden="true">
                  <Icon size={15} />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="hero-illustration">
        <Mascot />
      </div>
    </section>
  )
}

function NotificationsPanel() {
  const { items, loading } = useNotifications()
  return (
    <section className="notifications-panel" aria-label="Notifikasi">
      <div className="notifications-head">
        <h2>
          <Bell size={17} aria-hidden="true" />
          Notifikasi
        </h2>
        <Link to="/riwayat" className="small">
          Lihat riwayat
        </Link>
      </div>
      <NotificationList items={items.slice(0, 3)} loading={loading} />
    </section>
  )
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { profile, isAdmin } = useAuth()
  const [state, setState] = useState({ loading: true, error: '', stats: null, recent: [], overview: null })

  useEffect(() => {
    let active = true
    Promise.all([getMyStats(), listRecentAnalyses(5), isAdmin ? getAdminOverview().catch(() => null) : Promise.resolve(null)])
      .then(([stats, recent, overview]) => active && setState({ loading: false, error: '', stats, recent, overview }))
      .catch((error) => active && setState((prev) => ({ ...prev, loading: false, error: toFriendlyMessage(error, 'Gagal memuat dashboard.') })))
    return () => {
      active = false
    }
  }, [isAdmin])

  const firstName = (profile?.full_name || '').split(' ')[0]

  if (state.loading) return <PageLoading label="Memuat dashboard…" />

  const stats = state.stats
  const rows = toRows(stats?.category_counts)
  const totalUtterances = Number(stats?.total_utterances ?? 0)
  const totalAnalyses = Number(stats?.total_analyses ?? 0)
  const dominant = dominantOf(rows)
  const indirect = Number(stats?.speech_act_types?.indirect ?? 0)
  const indirectShare = percentOf(indirect, totalUtterances)
  const monthlyMap = Object.fromEntries((stats?.monthly ?? []).map((m) => [m.month, Number(m.count)]))
  const monthly = lastMonthKeys(6).map((month) => ({ month, count: monthlyMap[month] ?? 0 }))

  const recentPanel = (
    <section className="panel">
      <div className="panel-header">
        <h2>Analisis terbaru</h2>
        <Link to="/riwayat" className="small">
          Lihat semua
        </Link>
      </div>
      <div className="list">
        {state.recent.map((item) => (
          <div key={item.id} className="list-item">
            <div>
              <Link to={`/analisis/${item.id}`} className="list-item-title">
                {item.title}
              </Link>
              <div className="list-item-meta">
                <span>
                  <CalendarDays size={14} aria-hidden="true" />
                  {formatDateTime(item.created_at)}
                </span>
                <span>{formatNumber(item.total_utterances)} tuturan</span>
              </div>
            </div>
            <DominantCategories categories={item.dominant_categories} />
          </div>
        ))}
      </div>
    </section>
  )

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <Link to="/analisis/baru" className="btn btn-primary">
            <FilePlus2 size={18} aria-hidden="true" />
            Analisis baru
          </Link>
        }
      />

      {state.error && (
        <div style={{ marginBottom: 16 }}>
          <Alert type="error">{state.error}</Alert>
        </div>
      )}

      <div className="dashboard-top">
        <HeroCard firstName={firstName} isAdmin={isAdmin} />
        <NotificationsPanel />
      </div>

      <section className="stats-row" aria-label="Statistik utama">
        <StatCard tone="coral" icon={Files} label="Jumlah analisis" value={formatNumber(totalAnalyses)} />
        <StatCard tone="sky" icon={MessagesSquare} label="Tuturan dianalisis" value={formatNumber(totalUtterances)} />
        <StatCard
          tone="amber"
          icon={Sigma}
          label="Kategori dominan"
          textValue
          value={dominant.length ? dominant.map((k) => CATEGORIES[k].label).join(' & ') : '-'}
          note={dominant.length ? `${formatPercent(rows.find((r) => r.key === dominant[0]).percentage)} dari seluruh tuturan` : 'Belum ada data'}
        />
        <StatCard
          tone="green"
          icon={Shuffle}
          label="Tindak tutur tidak langsung"
          value={formatPercent(indirectShare)}
          note={`${formatNumber(indirect)} dari ${formatNumber(totalUtterances)} tuturan`}
        />
      </section>

      {totalAnalyses === 0 ? (
        <section className="panel">
          <EmptyState
            icon={MessagesSquare}
            title="Belum ada analisis"
            action={
              <Link to="/analisis/baru" className="btn btn-primary">
                <FilePlus2 size={18} aria-hidden="true" />
                Mulai analisis baru
              </Link>
            }
          >
            Tempel dialog, transkrip film, atau wawancara, lalu PragmaAI akan mengklasifikasikan setiap tuturan ke dalam lima kategori ilokusi Searle.
          </EmptyState>
        </section>
      ) : (
        <div className="stack">
          <div className="grid-main-side">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Distribusi lima kategori ilokusi</h2>
                  <p>Dihitung dari {formatNumber(totalUtterances)} tuturan pada semua analisis Anda.</p>
                </div>
              </div>
              <CategoryDistributionChart rows={rows} />
              <details className="mt-16">
                <summary className="small muted" style={{ cursor: 'pointer' }}>
                  Lihat sebagai tabel
                </summary>
                <div className="mt-8">
                  <DistributionTable rows={rows} total={totalUtterances} />
                </div>
              </details>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Analisis per bulan</h2>
                  <p>Enam bulan terakhir.</p>
                </div>
              </div>
              <MonthlyAnalysesChart data={monthly} />
            </section>
          </div>

          {state.overview ? (
            <div className="grid-main-side">
              {recentPanel}
              <section className="panel">
                <div className="panel-header">
                  <h2 className="row" style={{ gap: 8 }}>
                    <ShieldCheck size={19} color="var(--blue-600)" aria-hidden="true" />
                    Ringkasan sistem
                  </h2>
                </div>
                <dl className="kv-grid">
                  <div className="kv">
                    <dt>Pengguna</dt>
                    <dd>{formatNumber(state.overview.total_users)}</dd>
                  </div>
                  <div className="kv">
                    <dt>Admin</dt>
                    <dd>{formatNumber(state.overview.total_admins)}</dd>
                  </div>
                  <div className="kv">
                    <dt>Semua analisis</dt>
                    <dd>{formatNumber(state.overview.total_analyses)}</dd>
                  </div>
                  <div className="kv">
                    <dt>Semua tuturan</dt>
                    <dd>{formatNumber(state.overview.total_utterances)}</dd>
                  </div>
                  <div className="kv kv-full" style={{ borderBottom: 0 }}>
                    <dt>Umpan balik baru</dt>
                    <dd>
                      {formatNumber(state.overview.open_feedback)}{' '}
                      {state.overview.open_feedback > 0 && (
                        <Link to="/admin/umpan-balik" className="small">
                          Tinjau
                        </Link>
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="small faint mt-8">Hanya angka agregat; isi analisis pengguna tetap privat.</p>
              </section>
            </div>
          ) : (
            recentPanel
          )}
        </div>
      )}
    </>
  )
}
