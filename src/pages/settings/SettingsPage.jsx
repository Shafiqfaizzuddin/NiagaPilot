import { CircleUserRound, Settings2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function SettingsPage() {
  const { user } = useAuth()
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2><p className="mt-2 text-sm text-slate-500">Your account and workspace preferences.</p></div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CircleUserRound size={21} /></span><div><h3 className="font-semibold text-slate-900">Account</h3><p className="text-sm text-slate-500">Your sign-in details</p></div></div>
        <div className="mt-6 border-t border-slate-100 pt-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email address</p><p className="mt-1 text-sm text-slate-700">{user?.email || 'No account connected'}</p></div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Settings2 size={21} /></span><div><h3 className="font-semibold text-slate-900">Workspace preferences</h3><p className="text-sm text-slate-500">More options will be available as the app grows.</p></div></div>
      </section>
    </div>
  )
}
