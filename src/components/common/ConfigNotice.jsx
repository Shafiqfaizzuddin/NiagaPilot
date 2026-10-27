import { Info } from 'lucide-react'

export function ConfigNotice() {
  return (
    <div role="status" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Info className="mt-0.5 shrink-0" size={18} />
      <p><strong>Firebase isn’t configured.</strong> You’re viewing the interface only. Add your Firebase values to <code className="font-semibold">.env.local</code> to enable sign in and data services.</p>
    </div>
  )
}
