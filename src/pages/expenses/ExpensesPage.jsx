import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, ReceiptText } from 'lucide-react'
import { useBusiness } from '../../hooks/useBusiness'
import { useExpenses } from '../../hooks/useExpenses'
import { createExpense, deleteExpense, updateExpense } from '../../services/expenseService'
import { initialExpenseFilters, expenseStats, selectExpenses } from '../../utils/expenseData'
import { ExpenseDialog } from '../../components/expenses/ExpenseDialog'
import { DeleteExpenseDialog } from '../../components/expenses/DeleteExpenseDialog'
import { ExpenseFilters } from '../../components/expenses/ExpenseFilters'
import { ExpenseList } from '../../components/expenses/ExpenseList'
import { ExpenseSummary } from '../../components/expenses/ExpenseSummary'
import { CategoryBreakdown } from '../../components/expenses/CategoryBreakdown'

export function ExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { activeBusiness } = useBusiness()
  const { expenses, loading, error } = useExpenses(activeBusiness.id)
  const [filters, setFilters] = useState(initialExpenseFilters)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [formOpen, setFormOpen] = useState(() => searchParams.get('add') === '1')
  const [feedback, setFeedback] = useState('')
  const visible = useMemo(() => selectExpenses(expenses, filters), [expenses, filters])
  const stats = useMemo(() => expenseStats(expenses), [expenses])
  const filtered = filters.search || filters.category || filters.paymentMethod || filters.datePreset !== 'all'

  async function save(values) {
    if (editing) await updateExpense(activeBusiness.id, editing.id, values)
    else await createExpense(activeBusiness.id, values)
    closeForm()
    setEditing(null)
    setFeedback(editing ? 'Expense updated.' : 'Expense added.')
  }

  async function confirmDelete() {
    await deleteExpense(activeBusiness.id, deleting.id)
    setDeleting(null)
    setFeedback('Expense deleted.')
  }

  function openAdd() { setEditing(null); setFeedback(''); setFormOpen(true) }
  function openEdit(expense) { setEditing(expense); setFeedback(''); setFormOpen(true) }
  function closeForm() {
    setFormOpen(false)
    if (searchParams.has('add')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('add')
      setSearchParams(nextParams, { replace: true })
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-bold tracking-tight text-slate-900">Expenses</h2><p className="mt-2 text-sm text-slate-500">Track and manage your business spending. <span className="font-medium text-slate-700">{activeBusiness.name}</span></p></div><button type="button" onClick={openAdd} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Plus size={18} /> Add Expense</button></div>
    {feedback && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.code === 'permission-denied' ? 'You do not have permission to view these expenses. Check your Firestore rules.' : error.message || 'Could not load expenses.'}</div>}
    {loading ? <div aria-label="Loading expenses" className="space-y-4 animate-pulse"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 rounded-2xl bg-slate-200" />)}</div><div className="h-60 rounded-2xl bg-slate-200" /></div> : !error && <>
      <ExpenseSummary stats={stats} />
      <ExpenseFilters filters={filters} onChange={setFilters} onClear={() => setFilters(initialExpenseFilters)} />
      {visible.length ? <ExpenseList expenses={visible} onEdit={openEdit} onDelete={setDeleting} /> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><ReceiptText size={32} className="mx-auto text-emerald-600" /><h3 className="mt-4 font-semibold text-slate-900">{expenses.length && filtered ? 'No expenses match your filters.' : 'No expenses recorded yet.'}</h3><p className="mt-2 text-sm text-slate-500">{expenses.length && filtered ? 'Try a different search or date range.' : 'Add your first business expense to start tracking spending.'}</p>{expenses.length && filtered ? <button type="button" onClick={() => setFilters(initialExpenseFilters)} className="mt-5 min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-emerald-700">Clear Filters</button> : <button type="button" onClick={openAdd} className="mt-5 min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white">Add Expense</button>}</div>}
      <CategoryBreakdown expenses={visible} />
    </>}
    {formOpen && <ExpenseDialog key={editing?.id || 'new'} expense={editing} onSave={save} onClose={closeForm} />}
    {deleting && <DeleteExpenseDialog expense={deleting} onDelete={confirmDelete} onClose={() => setDeleting(null)} />}
  </div>
}
