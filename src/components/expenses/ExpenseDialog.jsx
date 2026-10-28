import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ExpenseForm } from './ExpenseForm'

export function ExpenseDialog({ expense, onSave, onClose }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    function onKeyDown(event) { if (event.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  async function save(values) {
    if (saving) return
    setError('')
    setSaving(true)
    try { await onSave(values) } catch (saveError) { setError(saveError?.code === 'permission-denied' ? 'You do not have permission to save this expense.' : saveError?.message || 'Could not save expense.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="expense-dialog-title" className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 id="expense-dialog-title" className="text-xl font-bold text-slate-900">{expense ? 'Edit expense' : 'Add expense'}</h2><p className="mt-1 text-sm text-slate-500">{expense ? 'Update this business expense.' : 'Record a new business expense.'}</p></div><button type="button" aria-label="Close" disabled={saving} onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={20} /></button></div>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <ExpenseForm expense={expense} onSave={save} onCancel={onClose} />
      </div>
    </div>
  )
}
