import {
  Bell,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  FilePlus2,
  History,
  LayoutGrid,
  LibraryBig,
  LogOut,
  Menu,
  MessageSquareWarning,
  Search,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { LogoMark } from '../components/Logo.jsx'
import { NotificationList } from '../components/NotificationList.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useNotifications } from '../hooks/useNotifications.js'
import { usePopover } from '../hooks/usePopover.js'
import { initials } from '../utils/format.js'

const MAIN_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/analisis/baru', label: 'Analisis baru', icon: FilePlus2 },
  { to: '/riwayat', label: 'Riwayat analisis', icon: History },
  { to: '/materi', label: 'Knowledge base', icon: BookOpenText },
]

const ADMIN_NAV = [
  { to: '/admin/materi', label: 'Kelola materi', icon: LibraryBig },
  { to: '/admin/pengguna', label: 'Kelola pengguna', icon: UsersRound },
  { to: '/admin/umpan-balik', label: 'Umpan balik', icon: MessageSquareWarning },
]

const todayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function NavItems({ items }) {
  return items.map(({ to, label, icon: Icon, end }) => (
    <NavLink key={to} to={to} end={end} className="nav-link" data-label={label} aria-label={label}>
      <Icon size={20} aria-hidden="true" />
      <span className="nav-label">{label}</span>
    </NavLink>
  ))
}

/** Kotak pencarian judul analisis; hasilnya dibuka di halaman Riwayat. */
function TopbarSearch() {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  function submit(event) {
    event.preventDefault()
    const q = term.trim()
    navigate(q ? `/riwayat?q=${encodeURIComponent(q)}` : '/riwayat')
  }
  return (
    <form className="topbar-search" role="search" onSubmit={submit}>
      <label className="visually-hidden" htmlFor="topbar-search">
        Cari analisis
      </label>
      <input id="topbar-search" className="input" type="search" placeholder="Cari judul analisis…" value={term} onChange={(e) => setTerm(e.target.value)} />
      <button type="submit" aria-label="Cari">
        <Search size={17} />
      </button>
    </form>
  )
}

function NotificationsButton() {
  const { open, setOpen, toggle, ref } = usePopover()
  const { items, loading } = useNotifications()
  const hasImportant = items.some((item) => item.important)
  return (
    <div className="popover-anchor" ref={ref}>
      <button type="button" className="icon-button" onClick={toggle} aria-expanded={open} aria-label="Notifikasi">
        <Bell size={18} />
        {hasImportant && <span className="dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="Notifikasi">
          <div className="popover-title">Notifikasi</div>
          <NotificationList items={items} loading={loading} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

function UserMenu({ displayName, isAdmin, onSignOut }) {
  const { open, setOpen, toggle, ref } = usePopover()
  return (
    <div className="popover-anchor" ref={ref}>
      <button type="button" className="user-button" onClick={toggle} aria-expanded={open} aria-haspopup="menu">
        <span className="avatar" aria-hidden="true">
          {initials(displayName)}
        </span>
        <span className="user-button-text">
          <span className="user-button-name">{displayName}</span>
          <span className="user-button-role">{isAdmin ? 'Admin' : 'Pengguna'}</span>
        </span>
        <ChevronDown size={16} className="user-button-text" aria-hidden="true" />
      </button>
      {open && (
        <div className="popover popover-narrow" role="menu">
          <Link to="/profil" className="menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <UserRound size={17} aria-hidden="true" />
            Profil saya
          </Link>
          <button type="button" className="menu-item danger" role="menuitem" onClick={onSignOut}>
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

/** Kerangka halaman setelah login: bingkai putih, sidebar ikon, topbar, dan konten. */
export function AppLayout() {
  const { profile, user, isAdmin, signOut } = useAuth()
  const location = useLocation()
  // Menu ponsel dicatat terbuka "untuk halaman tertentu", jadi otomatis tertutup saat pindah halaman.
  const [menuOpenFor, setMenuOpenFor] = useState(null)
  const menuOpen = menuOpenFor === location.pathname

  // Tanggal hari ini (dihitung sekali saat halaman dibuka).
  const [today] = useState(() => todayFormatter.format(new Date()))

  const displayName = profile?.full_name || user?.email || 'Pengguna'

  return (
    <div className="app-shell">
      <div className="app-frame">
        <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Navigasi utama">
          <Link to="/" className="sidebar-brand" aria-label="PragmaAI, ke dashboard">
            <LogoMark size={42} />
            <span className="sidebar-brand-text">
              <span className="brand-name">PRAGMAAI</span>
              <span className="brand-tagline">Intelligent Pragmatic Speech Act Analysis</span>
            </span>
          </Link>

          <nav className="nav-group" aria-label="Menu utama">
            <span className="nav-group-title">Menu</span>
            <NavItems items={MAIN_NAV} />
          </nav>

          {isAdmin && (
            <nav className="nav-group" aria-label="Menu admin">
              <span className="nav-group-title">Admin</span>
              <NavItems items={ADMIN_NAV} />
            </nav>
          )}

          <div className="sidebar-footer">
            <NavItems items={[{ to: '/profil', label: 'Profil', icon: UserRound }]} />
            <button type="button" className="nav-link" data-label="Logout" aria-label="Logout" onClick={signOut}>
              <LogOut size={20} aria-hidden="true" />
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </aside>

        <div className={`sidebar-backdrop ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpenFor(null)} aria-hidden="true" />

        <div className="main">
          <header className="topbar">
            <button
              type="button"
              className="icon-button topbar-menu"
              onClick={() => setMenuOpenFor(location.pathname)}
              aria-label="Buka menu navigasi"
              aria-expanded={menuOpen}
            >
              <Menu size={19} />
            </button>
            <Link to="/" className="topbar-brand">
              <LogoMark size={30} />
              PRAGMAAI
            </Link>

            <TopbarSearch />

            <span className="topbar-date">
              <CalendarDays size={16} aria-hidden="true" />
              {today}
            </span>

            <div className="topbar-actions">
              <NotificationsButton />
              <UserMenu displayName={displayName} isAdmin={isAdmin} onSignOut={signOut} />
            </div>
          </header>

          <main className="content" id="konten">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
