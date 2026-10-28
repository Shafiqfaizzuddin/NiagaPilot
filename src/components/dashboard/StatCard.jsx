export function StatCard({ label, icon: Icon, note, value }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Icon size={18} /></span>
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">{value ?? '—'}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </section>
  )
}
