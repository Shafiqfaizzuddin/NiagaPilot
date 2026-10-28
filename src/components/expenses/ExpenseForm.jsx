import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../config/expenseCategories'
import { localDateString } from '../../utils/localDates'
import { centsToRinggitInput } from '../../utils/money'
import { expenseFormSchema } from '../../validations/expenseSchema'

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 aria-invalid:border-red-400'

export function ExpenseForm({ expense, onSave, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: expense?.description || '',
      amount: expense ? centsToRinggitInput(expense.amountCents) : '',
      category: expense?.category || '',
      transactionDate: expense?.transactionDate || localDateString(),
      paymentMethod: expense?.paymentMethod || '',
      merchant: expense?.merchant || '',
      notes: expense?.notes || '',
    },
  })

  return (
    <form noValidate onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <label htmlFor="expense-description" className="mb-1 block text-sm font-medium">Description *</label>
        <input id="expense-description" autoFocus maxLength={120} placeholder="e.g. Cooking oil" aria-invalid={Boolean(errors.description)} className={inputClass} {...register('description')} />
        {errors.description && <p role="alert" className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expense-amount" className="mb-1 block text-sm font-medium">Amount (RM) *</label>
          <input id="expense-amount" inputMode="decimal" placeholder="25.50" aria-invalid={Boolean(errors.amount)} className={inputClass} {...register('amount')} />
          {errors.amount && <p role="alert" className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>
        <div>
          <label htmlFor="expense-category" className="mb-1 block text-sm font-medium">Category *</label>
          <select id="expense-category" aria-invalid={Boolean(errors.category)} className={inputClass} {...register('category')}>
            <option value="">Choose a category</option>
            {EXPENSE_CATEGORIES.map(({ value }) => <option key={value} value={value}>{value}</option>)}
          </select>
          {errors.category && <p role="alert" className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expense-date" className="mb-1 block text-sm font-medium">Transaction date *</label>
          <input id="expense-date" type="date" aria-invalid={Boolean(errors.transactionDate)} className={inputClass} {...register('transactionDate')} />
          {errors.transactionDate && <p role="alert" className="mt-1 text-xs text-red-600">{errors.transactionDate.message}</p>}
        </div>
        <div>
          <label htmlFor="expense-payment" className="mb-1 block text-sm font-medium">Payment method</label>
          <select id="expense-payment" className={inputClass} {...register('paymentMethod')}>
            <option value="">Not specified</option>
            {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="expense-merchant" className="mb-1 block text-sm font-medium">Merchant / supplier</label>
        <input id="expense-merchant" maxLength={120} placeholder="Optional" aria-invalid={Boolean(errors.merchant)} className={inputClass} {...register('merchant')} />
        {errors.merchant && <p role="alert" className="mt-1 text-xs text-red-600">{errors.merchant.message}</p>}
      </div>
      <div>
        <label htmlFor="expense-notes" className="mb-1 block text-sm font-medium">Notes</label>
        <textarea id="expense-notes" rows={3} maxLength={500} aria-invalid={Boolean(errors.notes)} className={`${inputClass} py-3`} {...register('notes')} />
        {errors.notes && <p role="alert" className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Saving…' : expense ? 'Save changes' : 'Save expense'}</button>
      </div>
    </form>
  )
}
