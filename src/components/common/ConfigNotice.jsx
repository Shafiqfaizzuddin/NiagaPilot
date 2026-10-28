import { Info } from 'lucide-react'
import { missingFirebaseConfig } from '../../config/firebase'

export function ConfigNotice() {
  return (
    <div role="status" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Info className="mt-0.5 shrink-0" size={18} />
      <p><strong>Firebase isn’t configured.</strong> Add the missing values to <code className="font-semibold">.env.local</code>, then restart the development server: <span className="font-medium">{missingFirebaseConfig.join(', ')}</span>.</p>
    </div>
  )
}
