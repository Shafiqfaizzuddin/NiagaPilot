import { CalendarDays, ChartNoAxesCombined, ReceiptText, Wallet } from 'lucide-react'
import { formatMYR } from '../../utils/money'

export function ExpenseSummary({ stats }) {
  const cards = [
    { label: 'Total expenses', value: formatMYR(stats.totalCents), scope: 'All time · active business', icon: Wallet },
    { label: 'Expenses this month', value: formatMYR(stats.monthCents), scope: 'Calendar month · active business', icon: CalendarDays },
    { label: 'Number of transactions', value: String(stats.count), scope: 'All time · active business', icon: ReceiptText },
    { label: 'Largest expense', value: formatMYR(stats.largestCents), scope: 'All time · active business', icon: ChartNoAxesCombined },
  ]
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, scope, icon: Icon }) => <section key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-medium text-slate-500">{label}</h3><Icon size={19} className="shrink-0 text-emerald-600" /></div><p className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-900" title={value}>{value}</p><p className="mt-1 text-xs text-slate-400">{scope}</p></section>)}</div>
}
