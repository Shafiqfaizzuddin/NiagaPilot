import { Link } from 'react-router'
import { ReceiptText } from 'lucide-react'
import { categoryConfig } from '../../config/expenseCategories'
import { selectExpenses, initialExpenseFilters } from '../../utils/expenseData'
import { formatMYR } from '../../utils/money'

export function RecentTransactions({ expenses }) {
  const recent = selectExpenses(expenses, initialExpenseFilters).slice(0, 5)
  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-slate-900">Recent transactions</h3><p className="mt-1 text-sm text-slate-500">Your five most recent expenses.</p></div><Link to="/expenses" className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-700 hover:underline">View All Expenses</Link></div>
    {recent.length ? <ul className="mt-4 divide-y divide-slate-100">{recent.map((expense) => {
      const { icon: Icon, color } = categoryConfig(expense.category)
      return <li key={expense.id} className="flex min-w-0 items-center gap-3 py-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50"><Icon size={19} style={{ color }} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{expense.description}</span><span className="block text-xs text-slate-500">{expense.transactionDate} · {expense.category}</span></span><span className="shrink-0 text-sm font-semibold text-slate-900">{formatMYR(expense.amountCents)}</span></li>
    })}</ul> : <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-5 text-sm text-slate-500"><ReceiptText size={20} className="shrink-0 text-emerald-600" />No expenses to show yet.</div>}
  </section>
}
