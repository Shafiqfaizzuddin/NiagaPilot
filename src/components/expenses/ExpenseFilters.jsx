import { Search } from 'lucide-react'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../config/expenseCategories'

const field = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15'

export function ExpenseFilters({ filters, onChange, onClear }) {
  const update = (key, value) => onChange({ ...filters, [key]: value })
  return <section aria-label="Expense filters" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
      <div className="relative"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input aria-label="Search expenses" value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Search description, merchant, notes" className={`${field} pl-10`} /></div>
      <select aria-label="Filter by category" value={filters.category} onChange={(event) => update('category', event.target.value)} className={field}><option value="">All categories</option>{EXPENSE_CATEGORIES.map(({ value }) => <option key={value} value={value}>{value}</option>)}</select>
      <select aria-label="Filter by payment method" value={filters.paymentMethod} onChange={(event) => update('paymentMethod', event.target.value)} className={field}><option value="">All payment methods</option>{PAYMENT_METHODS.map((value) => <option key={value} value={value}>{value}</option>)}</select>
      <select aria-label="Filter by date" value={filters.datePreset} onChange={(event) => update('datePreset', event.target.value)} className={field}><option value="all">All time</option><option value="today">Today</option><option value="last7">Last 7 days</option><option value="thisMonth">This month</option><option value="lastMonth">Last month</option><option value="custom">Custom range</option></select>
      <select aria-label="Sort expenses" value={filters.sort} onChange={(event) => update('sort', event.target.value)} className={field}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select>
    </div>
    {filters.datePreset === 'custom' && <div className="mt-3 grid gap-3 sm:max-w-md sm:grid-cols-2"><div><label htmlFor="filter-start" className="mb-1 block text-xs font-medium text-slate-600">From</label><input id="filter-start" type="date" value={filters.startDate} onChange={(event) => update('startDate', event.target.value)} className={field} /></div><div><label htmlFor="filter-end" className="mb-1 block text-xs font-medium text-slate-600">To</label><input id="filter-end" type="date" value={filters.endDate} onChange={(event) => update('endDate', event.target.value)} className={field} /></div></div>}
    {filters.datePreset === 'custom' && filters.startDate && filters.endDate && filters.startDate > filters.endDate && <p role="alert" className="mt-2 text-xs text-red-600">Start date must be before end date.</p>}
    <button type="button" onClick={onClear} className="mt-3 min-h-11 text-sm font-semibold text-emerald-700 hover:underline">Clear filters</button>
  </section>
}
