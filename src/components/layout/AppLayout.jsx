import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  ArrowRight, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, LayoutDashboard,
  Lightbulb, Menu, ReceiptText, Settings, ShoppingBag, Store, X,
} from 'lucide-react'
import { Brand } from '../common/Brand'
import { useAuth } from '../../hooks/useAuth'
import { useBusiness } from '../../hooks/useBusiness'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: ReceiptText },
  { to: '/sales', label: 'Sales', icon: ShoppingBag },
  { to: '/ai-insights', label: 'AI Insights', icon: Lightbulb },
]
const titles = {
  '/dashboard': ['Dashboard', 'Your business at a glance'],
  '/expenses': ['Expenses', 'Keep track of what your business spends'],
  '/sales': ['Sales', 'Record and review business revenue'],
  '/ai-insights': ['AI Business Insights', 'Understand your business performance'],
  '/settings': ['Settings', 'Manage your workspace preferences'],
  '/business/setup': ['Business setup', 'Get your business workspace ready'],
}

function SideNav({ collapsed, onNavigate }) {
  return (
    <nav aria-label="Main navigation" className="mt-7 space-y-1">
      {navigation.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} onClick={onNavigate} title={collapsed ? label : undefined}
          className={({ isActive }) => `group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
          <Icon size={19} className="shrink-0" />
          {!collapsed && <span className="flex-1">{label}</span>}
        </NavLink>
      ))}
      <div className="my-5 border-t border-slate-200" />
      <NavLink to="/settings" onClick={onNavigate} title={collapsed ? 'Settings' : undefined}
        className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
        <Settings size={19} className="shrink-0" />{!collapsed && 'Settings'}
      </NavLink>
    </nav>
  )
}

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, businessProfile }) {
  const closeMobile = () => setMobileOpen(false)
  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-900/45 lg:hidden" onClick={closeMobile} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'w-72 lg:w-20' : 'w-72'}`}>
        <div className="flex h-20 items-center justify-between px-5 lg:px-5">
          <Brand compact={collapsed && !mobileOpen} />
          <button type="button" aria-label="Close menu" onClick={closeMobile} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          {!collapsed && <p className="px-3 pt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>}
          <SideNav collapsed={collapsed && !mobileOpen} onNavigate={closeMobile} />
        </div>
        <div className="border-t border-slate-200 p-3">
          {!collapsed && <div className="mb-3 rounded-xl bg-slate-50 p-4 lg:block">
            {businessProfile ? <>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700"><Store size={17} className="text-emerald-600" /> Your business</div>
              <p className="truncate text-xs text-slate-500">{businessProfile.businessName}</p>
            </> : <>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><CircleHelp size={17} className="text-emerald-600" /> Just getting started?</div>
              <p className="text-xs leading-5 text-slate-500">Set up your business profile to prepare your workspace.</p>
              <NavLink to="/business/setup" onClick={closeMobile} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">Business setup <ArrowRight size={14} /></NavLink>
            </>}
          </div>}
          <button type="button" onClick={() => setCollapsed(!collapsed)} className="hidden min-h-10 w-full items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  )
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { currentUser, userProfile, logout } = useAuth()
  const { activeBusiness } = useBusiness()
  const [title, subtitle] = titles[pathname] || titles['/dashboard']
  const displayName = userProfile?.fullName || currentUser?.displayName || currentUser?.email
  const initials = (displayName || 'Guest').slice(0, 2).toUpperCase()

  async function handleSignOut() {
    try {
      await logout()
      navigate('/login')
    } catch {
      setSignOutError('Could not sign out. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} businessProfile={activeBusiness ? { businessName: activeBusiness.name } : null} />
      <div className={`min-h-screen transition-[margin] duration-200 ${collapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"><Menu size={21} /></button>
            <div className="min-w-0"><h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">{title}</h1><p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p></div>
          </div>
          <div className="relative">
            <button type="button" aria-expanded={profileOpen} aria-label="User profile menu" onClick={() => setProfileOpen(!profileOpen)} className="flex min-h-11 items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50">
              <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{initials}</span>
              <span className="hidden max-w-32 truncate text-left text-sm font-semibold text-slate-700 sm:block">{displayName}</span>
              <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
            </button>
            {profileOpen && <div className="absolute right-0 top-12 z-40 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              <NavLink to="/settings" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Settings</NavLink>
              <button type="button" onClick={handleSignOut} className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">Sign out</button>
            </div>}
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-8">
          {signOutError && <p role="alert" className="mb-4 text-sm text-red-600">{signOutError}</p>}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
