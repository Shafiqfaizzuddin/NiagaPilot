import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { getBriefingHistory } from '../../services/aiService'

export function AiPreview({ businessId }) {
  const [latest, setLatest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getBriefingHistory(businessId)
      .then((result) => { if (active) setLatest(result.items[0] || null) })
      .catch((cause) => { if (active) setError(cause.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [businessId])

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-center gap-2"><Sparkles size={19} className="text-emerald-600" /><h3 className="font-semibold text-slate-900">AI Business Insights</h3></div>
    {loading ? <div aria-label="Loading AI briefing preview" className="mt-4 h-16 animate-pulse rounded-xl bg-slate-100" />
      : error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>
        : latest ? <><p className="mt-3 text-sm font-medium text-slate-900">{latest.headline}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{latest.summary}</p><p className="mt-2 text-xs text-slate-400">{latest.generatedAt ? new Date(latest.generatedAt).toLocaleDateString('en-MY') : 'Saved recently'} · {latest.period.label}</p></>
          : <p className="mt-3 text-sm text-slate-500">No AI briefing yet. Generate one from your recorded sales and expenses when you are ready.</p>}
    <Link to="/ai-insights" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">View AI Insights <ArrowRight size={16} /></Link>
  </section>
}
