import { ArrowRight, Store } from 'lucide-react'
import { Link } from 'react-router'

export function BusinessSetupPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Store size={27} /></span>
        <p className="mt-7 text-xs font-bold uppercase tracking-widest text-emerald-700">Business profile</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Make this workspace yours</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">Business profile setup will let you add your business name, industry and other details. This page is ready for the next development phase.</p>
        <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No business details have been saved yet.</div>
        <Link to="/dashboard" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700">Back to dashboard <ArrowRight size={17} /></Link>
      </div>
    </div>
  )
}
