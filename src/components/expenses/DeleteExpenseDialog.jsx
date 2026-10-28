import { useState } from 'react'

export function DeleteExpenseDialog({ expense, onDelete, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function confirm() {
    if (busy) return
    setBusy(true)
    setError('')
    try { await onDelete() } catch (deleteError) {
      setError(deleteError?.code === 'permission-denied' ? 'You do not have permission to delete this expense.' : deleteError?.message || 'Could not delete expense.')
      setBusy(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="delete-title" className="text-xl font-bold text-slate-900">Delete expense?</h2>
        <p id="delete-description" className="mt-3 text-sm leading-6 text-slate-600">Delete “{expense.description}”? This cannot be undone.</p>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold">Cancel</button><button type="button" disabled={busy} onClick={confirm} className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Deleting…' : 'Delete expense'}</button></div>
      </div>
    </div>
  )
}
