import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, History, Lightbulb, Sparkles } from 'lucide-react'
import { useBusiness } from '../../hooks/useBusiness'
import { formatMYR } from '../../utils/money'
import {
  generateBusinessBriefing, getBriefingHistory, getFinancialAnalysis,
  getSavedBusinessBriefing, testNebiusConnection,
} from '../../services/aiService'

const periods = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
]
const healthLabels = {
  healthy: 'Healthy', attention: 'Needs Attention', critical: 'Critical', insufficient_data: 'Insufficient Data',
}

function MoneyCard({ label, cents, detail }) {
  return <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 break-words text-xl font-bold text-slate-900">{cents === null ? 'Unavailable' : formatMYR(cents)}</p>
    <p className="mt-1 text-xs text-slate-500">{detail}</p>
  </div>
}

function ObservationEvidence({ ids, observations }) {
  return <ul className="mt-3 space-y-1 text-xs text-slate-500">
    {ids.map((id) => {
      const item = observations.find((entry) => entry.id === id)
      if (!item) return null
      return <li key={id}>Evidence: {item.title}{item.changePercent !== undefined ? ` (${item.changePercent}% change)` : ''}{item.currentAmountCents !== undefined ? ` · ${formatMYR(item.currentAmountCents)} recorded` : ''}</li>
    })}
  </ul>
}

export function InsightsPage() {
  const { activeBusiness } = useBusiness()
  return <InsightsPageContent key={activeBusiness.id} activeBusiness={activeBusiness} />
}

function InsightsPageContent({ activeBusiness }) {
  const businessId = activeBusiness.id
  const [period, setPeriod] = useState('this_month')
  const [language, setLanguage] = useState('en')
  const [analysis, setAnalysis] = useState(null)
  const [briefing, setBriefing] = useState(null)
  const [history, setHistory] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [working, setWorking] = useState('')
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [stale, setStale] = useState(false)
  const [cached, setCached] = useState(false)
  const [introduction, setIntroduction] = useState('')

  useEffect(() => {
    let active = true
    getFinancialAnalysis(businessId, period)
      .then((result) => { if (active) { setAnalysis(result); setError('') } })
      .catch((cause) => { if (active) { setAnalysis(null); setError(cause.message) } })
      .finally(() => { if (active) setAnalysisLoading(false) })
    return () => { active = false }
  }, [businessId, period])

  useEffect(() => {
    let active = true
    getBriefingHistory(businessId)
      .then((result) => { if (active) { setHistory(result.items); setNextCursor(result.nextCursor) } })
      .catch((cause) => { if (active) setHistoryError(cause.message) })
      .finally(() => { if (active) setHistoryLoading(false) })
    return () => { active = false }
  }, [businessId])

  async function generate() {
    if (working) return
    setWorking('generate'); setError('')
    try {
      const result = await generateBusinessBriefing(businessId, period, language)
      setBriefing(result.briefing); setCached(result.cached); setStale(false)
      const updated = await getBriefingHistory(businessId)
      setHistory(updated.items); setNextCursor(updated.nextCursor); setHistoryError('')
    } catch (cause) { setError(cause.message) }
    finally { setWorking('') }
  }

  async function selectBriefing(id) {
    if (working) return
    setWorking(id); setError('')
    try {
      const result = await getSavedBusinessBriefing(businessId, id)
      setBriefing(result.briefing); setStale(result.stale); setCached(false)
    } catch (cause) { setError(cause.message) }
    finally { setWorking('') }
  }

  async function loadMore() {
    if (!nextCursor || working) return
    setWorking('history'); setHistoryError('')
    try {
      const result = await getBriefingHistory(businessId, nextCursor)
      setHistory((items) => [...items, ...result.items]); setNextCursor(result.nextCursor)
    } catch (cause) { setHistoryError(cause.message) }
    finally { setWorking('') }
  }

  async function testConnection() {
    if (working) return
    setWorking('test'); setError('')
    try {
      const result = await testNebiusConnection(businessId)
      setIntroduction(`${result.response} · ${result.model} · ${result.durationMs} ms`)
    } catch (cause) { setError(cause.message) }
    finally { setWorking('') }
  }

  const snapshot = analysis?.analysis
  const health = analysis?.businessHealth
  const expenseChange = snapshot?.metrics.expenses.changePercent

  return <div className="min-w-0 space-y-6">
    <header><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">AI Business Copilot</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">AI Business Insights</h2>
      <p className="mt-2 text-sm text-slate-500">Understand your business performance and discover opportunities to improve.</p>
      <p className="mt-2 text-xs font-medium text-slate-600">Business: {activeBusiness.name}</p>
    </header>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Analysis period
          <select value={period} onChange={(event) => { setPeriod(event.target.value); setAnalysisLoading(true) }} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 focus:border-emerald-600 focus:outline-none">{periods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        </label>
        <label className="text-sm font-medium text-slate-700">Language
          <select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 focus:border-emerald-600 focus:outline-none"><option value="en">English</option><option value="ms">Bahasa Melayu</option></select>
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={generate} disabled={Boolean(working) || analysisLoading} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Sparkles size={17} />{working === 'generate' ? 'Generating insights…' : 'Generate AI Insights'}</button>
        <button type="button" onClick={testConnection} disabled={Boolean(working)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 disabled:opacity-50">{working === 'test' ? 'Testing…' : 'Test AI connection'}</button>
      </div>
      {introduction && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{introduction}</p>}
    </section>

    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {analysisLoading ? <div aria-label="Loading financial analysis" className="grid animate-pulse gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 rounded-2xl bg-slate-200" />)}</div> : snapshot && <>
      <section><h3 className="mb-3 font-semibold text-slate-900">Financial overview · {snapshot.period.label}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <MoneyCard label="Recorded revenue" cents={snapshot.metrics.revenue.currentCents} detail={snapshot.dataStatus.salesAvailable ? 'Selected period' : 'No sales recorded yet'} />
          <MoneyCard label="Recorded expenses" cents={snapshot.metrics.expenses.currentCents} detail={expenseChange === null ? 'No comparable previous-period expenses' : `${expenseChange >= 0 ? '+' : ''}${expenseChange}% vs comparable period`} />
          <MoneyCard label="Estimated cash-based surplus" cents={snapshot.metrics.cashBased.surplusCents} detail="Recorded revenue minus recorded expenses" />
        </div>
        <p className="mt-2 text-xs text-slate-500">{snapshot.period.comparison}. {snapshot.dataStatus.explanation}</p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><AlertCircle size={18} className="text-emerald-600" /> Business health: {healthLabels[health.state]}</h3>
        <p className="mt-2 text-sm text-slate-600">{health.explanation}</p>
        <p className="mt-2 text-xs text-slate-500">An informal indicator based on available records and configurable thresholds.</p>
      </section>
    </>}

    {briefing ? <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Saved AI briefing</p><h3 className="mt-2 text-xl font-bold text-slate-900">{briefing.headline}</h3></div><span className="text-xs text-slate-500">{briefing.generatedAt ? new Date(briefing.generatedAt).toLocaleString('en-MY') : 'Recently saved'}</span></div>
      {stale && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Transactions have changed since this briefing was generated. Generate new insights for current figures.</p>}
      {cached && <p role="status" className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Showing an existing briefing for the same financial records.</p>}
      <p className="mt-4 text-sm leading-6 text-slate-700">{briefing.summary}</p>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div><h4 className="font-semibold text-slate-900">Key findings</h4>{briefing.keyFindings.length ? <ul className="mt-3 space-y-3">{briefing.keyFindings.map((item, index) => <li key={index} className="rounded-xl border border-slate-200 p-4"><p className="font-medium text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.explanation}</p><ObservationEvidence ids={item.observationIds} observations={briefing.observations} /></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No supported findings for this period.</p>}</div>
        <div><h4 className="font-semibold text-slate-900">Recommended actions</h4><ul className="mt-3 space-y-3">{briefing.recommendations.map((item, index) => <li key={index} className="rounded-xl border border-slate-200 p-4"><p className="font-medium text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.description}</p><p className="mt-2 text-sm text-slate-500">{item.reason}</p><ObservationEvidence ids={item.observationIds} observations={briefing.observations} /></li>)}</ul></div>
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">{briefing.provider} · {briefing.model} · {briefing.period.label} · {briefing.language === 'ms' ? 'Bahasa Melayu' : 'English'}. Estimated cash-based surplus is not accounting net profit.</div>
    </section> : <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center"><Lightbulb size={26} className="mx-auto text-emerald-600" /><h3 className="mt-3 font-semibold">No briefing selected</h3><p className="mt-2 text-sm text-slate-500">Generate insights or open a saved briefing below.</p></section>}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900"><History size={18} /> Briefing history</h3>
      {historyError && <p role="alert" className="mt-3 text-sm text-red-700">{historyError}</p>}
      {historyLoading ? <p className="mt-4 text-sm text-slate-500">Loading saved briefings…</p> : history.length ? <ul className="mt-4 divide-y divide-slate-100">{history.map((item) => <li key={item.id}><button type="button" onClick={() => selectBriefing(item.id)} disabled={Boolean(working)} className="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left disabled:opacity-50"><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-900">{item.headline}</span><span className="block text-xs text-slate-500">{item.period.label} · {item.generatedAt ? new Date(item.generatedAt).toLocaleDateString('en-MY') : 'Saved recently'}</span></span><ArrowRight size={16} className="shrink-0 text-slate-400" /></button></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No saved briefings yet. Generate your first insights above.</p>}
      {nextCursor && <button type="button" onClick={loadMore} disabled={Boolean(working)} className="mt-4 min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 disabled:opacity-50">{working === 'history' ? 'Loading…' : 'Load more'}</button>}
    </section>
  </div>
}
