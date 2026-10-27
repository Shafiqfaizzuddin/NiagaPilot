import { Plus, ReceiptText, Search } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'

export function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-2xl font-bold tracking-tight text-slate-900">Business expenses</h2><p className="mt-2 text-sm text-slate-500">Every cost in one place, so you can stay on top of spending.</p></div>
        <button type="button" disabled title="Expense entry is coming in the next phase" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white opacity-50"><Plus size={18} /> Add expense</button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-semibold text-slate-900">All expenses</h3><p className="mt-1 text-sm text-slate-500">Your expense history will be listed here.</p></div>
          <div className="relative w-full sm:w-60"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Search expenses" disabled placeholder="Search expenses" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm placeholder:text-slate-400" /></div>
        </div>
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid"><span>Expense</span><span>Category</span><span>Date</span><span className="text-right">Amount</span></div>
        <div className="p-5 sm:p-6"><EmptyState icon={ReceiptText} title="Your expense list is empty" description="Expense entry and receipt uploads are planned for the next development phase. No transactions have been created." /></div>
      </section>
    </div>
  )
}
