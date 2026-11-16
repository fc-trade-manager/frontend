import { ArrowLeftRight, Bell, ChevronDown, Eye, LayoutDashboard, LogOut, Moon, Store, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { fullNow } from '../lib/format'
import { useUnreadAlerts } from '../lib/hooks'
import { useTheme } from '../lib/theme'
import { Logo } from './ui'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/watchlist', label: 'Watchlist', icon: Eye },
  { to: '/trades', label: 'Trades', icon: ArrowLeftRight },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/market', label: 'Market', icon: Store },
]

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return <span className="clock muted mono">{fullNow(now)}</span>
}

function AccountMenu() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  if (!session || !session.user) return null
  const name = session.user.displayName || session.user.username || 'User'
  console.log("Dados do usuário na sessão:", session.user);
  return (
    <div className="account" ref={ref}>
      <button type="button" className="account__btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
        <span className="account__name">{name}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="account__menu card">
          <div className="account__who">
            <strong>{name}</strong>
            <span className="muted">{session.user.email}</span>
          </div>
          <button
            type="button"
            className="account__item"
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export function AppLayout() {
  const unread = useUnreadAlerts()
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Logo />
        </div>
        <nav className="sidebar__nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <Clock />
          <div className="topbar__right">
            <ThemeToggle />
            <Link to="/alerts" className="icon-btn bell" aria-label={`Alerts${unread ? `, ${unread} unread` : ''}`}>
              <Bell size={18} />
              {unread > 0 && <span className="bell__badge">{unread > 9 ? '9+' : unread}</span>}
            </Link>
            <AccountMenu />
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function PublicLayout() {
  return (
    <div className="public">
      <header className="public__bar">
        <Link to="/market">
          <Logo />
        </Link>
        <div className="topbar__right">
          <ThemeToggle />
          <Link to="/login" className="btn btn--ghost">
            Sign in
          </Link>
          <Link to="/register" className="btn btn--primary">
            Create account
          </Link>
        </div>
      </header>
      <main className="public__content">
        <Outlet />
      </main>
    </div>
  )
}

/** public market */
export function MarketShell() {
  const { session } = useAuth()
  return session ? <AppLayout /> : <PublicLayout />
}

export function Protected() {
  const { session } = useAuth()
  return session ? <Outlet /> : <Navigate to="/login" replace />
}

export function GuestOnly() {
  const { session } = useAuth()
  return session ? <Navigate to="/" replace /> : <Outlet />
}
