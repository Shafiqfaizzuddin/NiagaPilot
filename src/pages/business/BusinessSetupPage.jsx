import { Navigate, useNavigate } from 'react-router'
import { Store } from 'lucide-react'
import { BusinessForm } from '../../components/business/BusinessForm'
import { BusinessLoadState } from '../../components/common/BusinessLoadState'
import { AuthLoading } from '../../components/common/AuthLoading'
import { useBusiness } from '../../hooks/useBusiness'

export function BusinessSetupPage() {
  const navigate = useNavigate()
  const { activeBusiness, businessLoading, businessError, createActiveBusiness } = useBusiness()

  if (businessLoading) return <AuthLoading />
  if (businessError) return <BusinessLoadState />
  if (activeBusiness) return <Navigate to="/dashboard" replace />

  async function handleSave(values) {
    await createActiveBusiness(values)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Store size={27} /></span>
        <p className="mt-7 text-xs font-bold uppercase tracking-widest text-emerald-700">WELCOME TO NIAGAPILOT AI</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Tell us about your business</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">Your business profile keeps future expense records connected to the right workspace. You can update these details in Settings.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="mb-6 text-base font-semibold text-slate-900">Business information</h3>
        <BusinessForm onSave={handleSave} submitLabel="Create business and continue" />
      </div>
    </div>
  )
}
