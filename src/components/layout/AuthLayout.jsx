import { Brand } from '../common/Brand'
import { ConfigNotice } from '../common/ConfigNotice'
import { useAuth } from '../../hooks/useAuth'

export function AuthLayout({ title, subtitle, children }) {
  const { isFirebaseConfigured } = useAuth()
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="px-5 py-6 sm:px-10"><Brand /></header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="mb-7 text-center"><h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p></div>
          {!isFirebaseConfigured && <div className="mb-5"><ConfigNotice /></div>}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>
        </div>
      </main>
      <footer className="px-4 pb-6 text-center text-xs text-slate-400">NiagaPilot AI · Built for Malaysian small businesses</footer>
    </div>
  )
}
