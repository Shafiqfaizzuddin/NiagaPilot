import { ChartNoAxesCombined } from 'lucide-react'

export function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
        <ChartNoAxesCombined size={22} strokeWidth={2.4} />
      </span>
      {!compact && <span className="text-[17px] font-bold tracking-tight text-slate-900">NiagaPilot <span className="text-emerald-600">AI</span></span>}
    </div>
  )
}
