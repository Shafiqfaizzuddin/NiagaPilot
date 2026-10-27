export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center sm:py-16">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon size={26} /></div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
