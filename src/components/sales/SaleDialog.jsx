import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { SaleForm } from './SaleForm'

export function SaleDialog({ sale, onSave, onClose }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    function onKeyDown(event) { if (event.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])
  async function save(values) {
    if (saving) return
    setSaving(true); setError('')
    try { await onSave(values) } catch (cause) {
      setError(cause?.code === 'permission-denied' ? 'You do not have permission to save this sale.' : cause?.message || 'Could not save sale.')
    } finally { setSaving(false) }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="sale-dialog-title" className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3"><div><h2 id="sale-dialog-title" className="text-xl font-bold text-slate-900">{sale ? 'Edit sale' : 'Add sale'}</h2><p className="mt-1 text-sm text-slate-500">Record revenue received by this business.</p></div><button type="button" aria-label="Close" disabled={saving} onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={20} /></button></div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <SaleForm sale={sale} onSave={save} onCancel={onClose} />
    </div>
  </div>
}
