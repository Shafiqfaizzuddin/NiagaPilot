import { LoaderCircle } from 'lucide-react'

export function AuthLoading() {
  return (
    <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600">
      <LoaderCircle className="animate-spin text-emerald-600" size={28} />
      <p className="text-sm">Loading your workspace…</p>
    </div>
  )
}
