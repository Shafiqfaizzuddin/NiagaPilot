import { useState } from 'react'
import { getAuthErrorMessage } from '../../utils/authErrors'
import { useAuth } from '../../hooks/useAuth'

export function AuthError() {
  const { currentUser, error, retrySession, logout } = useAuth()
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    try {
      await retrySession()
    } catch {
      setRetrying(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Could not load your workspace</h1>
        {currentUser && <p className="mt-3 text-sm leading-6 text-slate-600">You are signed in, but your account data could not be loaded from Cloud Firestore.</p>}
        <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">{getAuthErrorMessage(error)}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" disabled={retrying} onClick={handleRetry} className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{retrying ? 'Retrying…' : 'Try again'}</button>
          <button type="button" onClick={logout} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700">Sign out</button>
        </div>
      </div>
    </div>
  )
}
