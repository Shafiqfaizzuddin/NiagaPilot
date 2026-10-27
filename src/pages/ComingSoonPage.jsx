import { ArrowLeft, Lightbulb, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router'

export function ComingSoonPage({ type }) {
  const isSales = type === 'sales'
  const Icon = isSales ? ShoppingBag : Lightbulb
  return (
    <div className="mx-auto max-w-xl pt-8 sm:pt-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon size={29} /></span>
        <p className="mt-7 text-xs font-bold uppercase tracking-widest text-emerald-700">Coming later</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">{isSales ? 'Sales tracking' : 'AI Insights'}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">{isSales ? 'Daily sales recording is planned for a future phase.' : 'AI-powered financial recommendations are planned for a future phase.'}</p>
        <Link to="/dashboard" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} /> Back to dashboard</Link>
      </div>
    </div>
  )
}
