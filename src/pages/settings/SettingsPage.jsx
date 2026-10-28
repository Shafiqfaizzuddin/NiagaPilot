import { useState } from 'react'
import { CircleUserRound, Store } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useBusiness } from '../../hooks/useBusiness'
import { BusinessForm } from '../../components/business/BusinessForm'

export function SettingsPage() {
  const { currentUser } = useAuth()
  const { activeBusiness, updateActiveBusiness } = useBusiness()
  const [saved, setSaved] = useState(false)

  async function handleSave(values) {
    setSaved(false)
    await updateActiveBusiness(values)
    setSaved(true)
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2><p className="mt-2 text-sm text-slate-500">Your account and workspace preferences.</p></div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CircleUserRound size={21} /></span><div><h3 className="font-semibold text-slate-900">Account</h3><p className="text-sm text-slate-500">Your sign-in details</p></div></div>
        <div className="mt-6 border-t border-slate-100 pt-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email address</p><p className="mt-1 text-sm text-slate-700">{currentUser?.email || 'No account connected'}</p></div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Store size={21} /></span><div><h3 className="font-semibold text-slate-900">Business profile</h3><p className="text-sm text-slate-500">Update the details for your active business.</p></div></div>
        {saved && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Business details saved.</p>}
        <BusinessForm key={activeBusiness.id} initialValues={activeBusiness} onSave={handleSave} submitLabel="Save changes" />
      </section>
    </div>
  )
}
