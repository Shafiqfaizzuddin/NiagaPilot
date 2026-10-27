import { ArrowRight, ChartColumnIncreasing, ReceiptText, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { StatCard } from '../../components/dashboard/StatCard'
import { EmptyState } from '../../components/common/EmptyState'
import { useAuth } from '../../hooks/useAuth'

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.displayName?.split(' ')[0]
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">YOUR WORKSPACE</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome{firstName ? `, ${firstName}` : ''} 👋</h2>
          <p className="mt-2 text-sm text-slate-500">A clearer view of your business starts here.</p>
        </div>
        <Link to="/expenses" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700">View expenses <ArrowRight size={17} /></Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total expenses" icon={Wallet} note="Available when expense tracking is enabled" />
        <StatCard label="Expenses this month" icon={ReceiptText} note="No expense data yet" />
        <StatCard label="Spending overview" icon={ChartColumnIncreasing} note="Insights will appear with your records" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><h3 className="font-semibold text-slate-900">Recent expenses</h3><p className="mt-1 text-sm text-slate-500">Your latest business spending in one place.</p></div>
            <Link to="/expenses" className="shrink-0 text-sm font-semibold text-emerald-700 hover:underline">View all</Link>
          </div>
          <EmptyState icon={ReceiptText} title="No expenses to show yet" description="Expense records will appear here once the tracking feature is ready." />
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-semibold text-slate-900">Getting started</h3>
          <p className="mt-1 text-sm text-slate-500">A few steps to make this workspace yours.</p>
          <div className="mt-6 space-y-3">
            <Link to="/business/setup" className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">Set up your business</span><span className="block text-xs text-slate-500">Add your business details later</span></span>
              <ArrowRight size={17} className="text-slate-400" />
            </Link>
            <Link to="/expenses" className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">2</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">Explore expenses</span><span className="block text-xs text-slate-500">See where records will live</span></span>
              <ArrowRight size={17} className="text-slate-400" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
