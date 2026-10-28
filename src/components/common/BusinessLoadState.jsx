import { useState } from 'react'
import { getBusinessErrorMessage } from '../../utils/businessErrors'
import { useBusiness } from '../../hooks/useBusiness'

export function BusinessLoadState() {
  const { businessError, refreshBusiness } = useBusiness()
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    try {
      await refreshBusiness()
    } catch {
      setRetrying(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold text-slate-900">Could not load your business</h2>
      <p role="alert" className="mt-2 text-sm leading-6 text-slate-600">{getBusinessErrorMessage(businessError)}</p>
      <button type="button" disabled={retrying} onClick={handleRetry} className="mt-5 min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50">
        {retrying ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  )
}
