import { useState } from 'react'
import { ArrowRight, CalendarDays, Plus, ReceiptText, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { StatCard } from '../../components/dashboard/StatCard'
import { ExpenseTrendChart } from '../../components/dashboard/ExpenseTrendChart'
import { RecentTransactions } from '../../components/dashboard/RecentTransactions'
import { CategoryBreakdown } from '../../components/expenses/CategoryBreakdown'
import { useAuth } from '../../hooks/useAuth'
import { useBusiness } from '../../hooks/useBusiness'
import { useExpenses } from '../../hooks/useExpenses'
import { dashboardExpenseStats, greetingForLocalTime, monthComparison } from '../../utils/dashboardData'
import { formatMYR } from '../../utils/money'

export function DashboardPage() {
  const { userProfile } = useAuth()
  const { activeBusiness } = useBusiness()
  const { expenses, loading, error } = useExpenses(activeBusiness.id)
  const [trendPeriod, setTrendPeriod] = useState('last7')
  const now = new Date()
  const firstName = userProfile?.fullName?.trim().split(/\s+/)[0] || 'there'
  const currentDate = new Intl.DateTimeFormat('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  const stats = dashboardExpenseStats(expenses, now)

  return <div className="space-y-6 sm:space-y-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Spending overview</p><h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{greetingForLocalTime(now)}, {firstName}!</h2><p className="mt-2 text-sm text-slate-500">Here's an overview of your business spending.</p><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600"><span className="inline-flex min-w-0 items-center gap-1.5"><Wallet size={15} className="shrink-0 text-emerald-600" /><span className="break-words">{activeBusiness.name}</span></span><span className="inline-flex items-center gap-1.5"><CalendarDays size={15} className="shrink-0 text-emerald-600" />{currentDate}</span></div></div>
      <Link to="/expenses?add=1" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Plus size={18} /> Add Expense</Link>
    </header>

    {loading ? <div aria-label="Loading dashboard expenses" className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}</div><div className="grid gap-5 xl:grid-cols-2"><div className="h-80 animate-pulse rounded-2xl bg-slate-200" /><div className="h-80 animate-pulse rounded-2xl bg-slate-200" /></div></div> : error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error.code === 'permission-denied' ? 'You do not have permission to load these expenses. Check your Firestore rules.' : error.message || 'Could not load business expenses. Please try again.'}</div> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Expenses" icon={Wallet} value={formatMYR(stats.totalCents)} note="All time · active business" />
        <StatCard label="Expenses This Month" icon={CalendarDays} value={formatMYR(stats.thisMonthCents)} note="Current local calendar month" />
        <StatCard label="Expenses Last Month" icon={CalendarDays} value={formatMYR(stats.lastMonthCents)} note="Previous local calendar month" />
        <StatCard label="Number of Transactions" icon={ReceiptText} value={String(stats.count)} note="All time · active business" />
      </div>
      <p role="status" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{monthComparison(stats.thisMonthCents, stats.lastMonthCents)}</p>
      {expenses.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><ReceiptText size={32} className="mx-auto text-emerald-600" /><h3 className="mt-3 font-semibold text-slate-900">No expenses to show yet</h3><p className="mt-2 text-sm text-slate-500">Record your first expense to start seeing spending trends here.</p><Link to="/expenses?add=1" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white">Add Expense</Link></div>}
      {expenses.length > 0 && <div className="grid min-w-0 gap-5 xl:grid-cols-2"><ExpenseTrendChart expenses={expenses} period={trendPeriod} onPeriodChange={setTrendPeriod} now={now} /><CategoryBreakdown expenses={expenses} title="Category distribution" scopeLabel="All expenses for the active business." compact /></div>}
      <RecentTransactions expenses={expenses} />
    </>}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h3 className="font-semibold text-slate-900">Quick actions</h3><div className="mt-4 grid gap-3 sm:grid-cols-2"><Link to="/expenses?add=1" className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"><span className="inline-flex items-center gap-2"><Plus size={18} /> Add Expense</span><ArrowRight size={17} /></Link><Link to="/expenses" className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><span className="inline-flex items-center gap-2"><ReceiptText size={18} /> View Expenses</span><ArrowRight size={17} /></Link></div></section>
  </div>
}
