import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TREND_PERIODS, expenseTrend } from '../../utils/dashboardData'
import { formatMYR } from '../../utils/money'

export function ExpenseTrendChart({ expenses, period, onPeriodChange, now }) {
  const trend = expenseTrend(expenses, period, now)
  const hasSpending = trend.some((day) => day.amountCents > 0n)
  const chartData = trend.map(({ date, chartValue }) => ({ date, chartValue }))

  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold text-slate-900">Expense trend</h3><p className="mt-1 text-sm text-slate-500">Daily spending for the selected local date range.</p></div><label className="shrink-0 text-sm text-slate-600"><span className="sr-only">Trend period</span><select aria-label="Trend period" value={period} onChange={(event) => onPeriodChange(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15">{TREND_PERIODS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    {hasSpending ? <div role="img" aria-label={`Daily expense trend, ${TREND_PERIODS.find((item) => item.value === period)?.label}`} className="mt-5 h-64 w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} minTickGap={24} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={(cents) => formatMYR(cents).replace(/\.00$/, '')} width={72} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [formatMYR(value), 'Expenses']} labelFormatter={(date) => date} /><Bar dataKey="chartValue" fill="#059669" radius={[5, 5, 0, 0]} maxBarSize={36} isAnimationActive={false} /></BarChart></ResponsiveContainer></div> : <p className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No expenses recorded in this period.</p>}
  </section>
}
