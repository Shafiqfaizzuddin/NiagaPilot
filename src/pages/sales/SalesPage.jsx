import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ShoppingBag } from 'lucide-react'
import { PAYMENT_METHODS } from '../../config/expenseCategories'
import { useBusiness } from '../../hooks/useBusiness'
import { useSales } from '../../hooks/useSales'
import { createSale, deleteSale, updateSale } from '../../services/saleService'
import { selectSales, saleStats } from '../../utils/saleData'
import { formatMYR } from '../../utils/money'
import { SaleDialog } from '../../components/sales/SaleDialog'
import { DeleteSaleDialog } from '../../components/sales/DeleteSaleDialog'
import { SaleList } from '../../components/sales/SaleList'

const initialFilters = { search: '', paymentMethod: '', sort: 'newest' }
const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15'

export function SalesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { activeBusiness } = useBusiness()
  const { sales, loading, error } = useSales(activeBusiness.id)
  const [filters, setFilters] = useState(initialFilters)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [formOpen, setFormOpen] = useState(() => searchParams.get('add') === '1')
  const [feedback, setFeedback] = useState('')
  const visible = useMemo(() => selectSales(sales, filters), [sales, filters])
  const stats = useMemo(() => saleStats(sales), [sales])
  const filtered = Boolean(filters.search || filters.paymentMethod)

  function closeForm() {
    setFormOpen(false)
    if (searchParams.has('add')) {
      const next = new URLSearchParams(searchParams)
      next.delete('add')
      setSearchParams(next, { replace: true })
    }
  }
  function openAdd() { setEditing(null); setFeedback(''); setFormOpen(true) }
  function openEdit(sale) { setEditing(sale); setFeedback(''); setFormOpen(true) }
  async function save(values) {
    if (editing) await updateSale(activeBusiness.id, editing.id, values)
    else await createSale(activeBusiness.id, values)
    closeForm()
    setFeedback(editing ? 'Sale updated.' : 'Sale added.')
    setEditing(null)
  }
  async function confirmDelete() {
    await deleteSale(activeBusiness.id, deleting.id)
    setDeleting(null)
    setFeedback('Sale deleted.')
  }
  const cards = [
    { label: 'Total recorded sales', value: formatMYR(stats.totalCents), scope: 'All time · active business' },
    { label: 'Sales this month', value: formatMYR(stats.monthCents), scope: 'Current local calendar month' },
    { label: 'Sales last month', value: formatMYR(stats.previousMonthCents), scope: 'Previous local calendar month' },
    { label: 'Sales transactions', value: String(stats.count), scope: 'All time · active business' },
  ]

  return <div className="min-w-0 space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-bold tracking-tight text-slate-900">Sales</h2><p className="mt-2 text-sm text-slate-500">Record revenue received by your business. <span className="font-medium text-slate-700">{activeBusiness.name}</span></p></div><button type="button" onClick={openAdd} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Plus size={18} /> Add Sale</button></header>
    {feedback && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.code === 'permission-denied' ? 'You do not have permission to view these sales. Check your Firestore rules.' : error.message || 'Could not load sales.'}</p>}
    {loading ? <div aria-label="Loading sales" className="space-y-4 animate-pulse"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 rounded-2xl bg-slate-200" />)}</div><div className="h-60 rounded-2xl bg-slate-200" /></div> : !error && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <section key={card.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{card.label}</p><p className="mt-3 truncate text-2xl font-bold text-slate-900" title={card.value}>{card.value}</p><p className="mt-1 text-xs text-slate-400">{card.scope}</p></section>)}</div>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3"><label className="text-sm font-medium text-slate-700">Search sales<input value={filters.search} onChange={(event) => setFilters((before) => ({ ...before, search: event.target.value }))} placeholder="Description, customer, notes" className={`mt-1 ${inputClass}`} /></label><label className="text-sm font-medium text-slate-700">Payment method<select value={filters.paymentMethod} onChange={(event) => setFilters((before) => ({ ...before, paymentMethod: event.target.value }))} className={`mt-1 ${inputClass}`}><option value="">All methods</option>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Sort by<select value={filters.sort} onChange={(event) => setFilters((before) => ({ ...before, sort: event.target.value }))} className={`mt-1 ${inputClass}`}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select></label></div>
      {visible.length ? <SaleList sales={visible} onEdit={openEdit} onDelete={setDeleting} /> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><ShoppingBag size={32} className="mx-auto text-emerald-600" /><h3 className="mt-4 font-semibold text-slate-900">{sales.length && filtered ? 'No sales match your filters.' : 'No sales recorded yet.'}</h3><p className="mt-2 text-sm text-slate-500">{sales.length && filtered ? 'Try another search or payment method.' : 'Add your first sale to start tracking recorded revenue.'}</p>{sales.length && filtered ? <button type="button" onClick={() => setFilters(initialFilters)} className="mt-5 min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-emerald-700">Clear Filters</button> : <button type="button" onClick={openAdd} className="mt-5 min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white">Add Sale</button>}</div>}
    </>}
    {formOpen && <SaleDialog key={editing?.id || 'new'} sale={editing} onSave={save} onClose={closeForm} />}
    {deleting && <DeleteSaleDialog sale={deleting} onDelete={confirmDelete} onClose={() => setDeleting(null)} />}
  </div>
}
