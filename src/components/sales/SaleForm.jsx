import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PAYMENT_METHODS } from '../../config/expenseCategories'
import { localDateString } from '../../utils/localDates'
import { centsToRinggitInput } from '../../utils/money'
import { saleFormSchema } from '../../validations/saleSchema'

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 aria-invalid:border-red-400'

export function SaleForm({ sale, onSave, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      description: sale?.description || '',
      amount: sale ? centsToRinggitInput(sale.amountCents) : '',
      transactionDate: sale?.transactionDate || localDateString(),
      paymentMethod: sale?.paymentMethod || '',
      customer: sale?.customer || '',
      notes: sale?.notes || '',
    },
  })
  return <form noValidate onSubmit={handleSubmit(onSave)} className="space-y-4">
    <div><label htmlFor="sale-description" className="mb-1 block text-sm font-medium">Sale description *</label>
      <input id="sale-description" maxLength={120} placeholder="e.g. Lunch orders" aria-invalid={Boolean(errors.description)} className={inputClass} {...register('description')} />
      {errors.description && <p role="alert" className="mt-1 text-xs text-red-600">{errors.description.message}</p>}</div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="sale-amount" className="mb-1 block text-sm font-medium">Amount (RM) *</label>
        <input id="sale-amount" inputMode="decimal" placeholder="25.50" aria-invalid={Boolean(errors.amount)} className={inputClass} {...register('amount')} />
        {errors.amount && <p role="alert" className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}</div>
      <div><label htmlFor="sale-date" className="mb-1 block text-sm font-medium">Transaction date *</label>
        <input id="sale-date" type="date" aria-invalid={Boolean(errors.transactionDate)} className={inputClass} {...register('transactionDate')} />
        {errors.transactionDate && <p role="alert" className="mt-1 text-xs text-red-600">{errors.transactionDate.message}</p>}</div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="sale-payment" className="mb-1 block text-sm font-medium">Payment method</label>
        <select id="sale-payment" className={inputClass} {...register('paymentMethod')}><option value="">Not specified</option>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}</select></div>
      <div><label htmlFor="sale-customer" className="mb-1 block text-sm font-medium">Customer</label>
        <input id="sale-customer" maxLength={120} placeholder="Optional" aria-invalid={Boolean(errors.customer)} className={inputClass} {...register('customer')} />
        {errors.customer && <p role="alert" className="mt-1 text-xs text-red-600">{errors.customer.message}</p>}</div>
    </div>
    <div><label htmlFor="sale-notes" className="mb-1 block text-sm font-medium">Notes</label>
      <textarea id="sale-notes" rows={3} maxLength={500} aria-invalid={Boolean(errors.notes)} className={`${inputClass} py-3`} {...register('notes')} />
      {errors.notes && <p role="alert" className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}</div>
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} disabled={isSubmitting} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold">Cancel</button>
      <button type="submit" disabled={isSubmitting} className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Saving…' : sale ? 'Save changes' : 'Save sale'}</button>
    </div>
  </form>
}
