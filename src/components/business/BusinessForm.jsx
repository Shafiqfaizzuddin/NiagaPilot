import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { BUSINESS_CATEGORIES, businessSchema } from '../../validations/businessSchema'
import { getBusinessErrorMessage } from '../../utils/businessErrors'

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 aria-invalid:border-red-400'

export function BusinessForm({ initialValues, onSave, submitLabel }) {
  const [submitError, setSubmitError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: initialValues?.name || '',
      category: initialValues?.category || '',
      description: initialValues?.description || '',
      location: initialValues?.location || '',
      currency: 'MYR',
    },
  })

  async function submit(values) {
    setSubmitError('')
    try {
      await onSave(values)
    } catch (error) {
      setSubmitError(getBusinessErrorMessage(error))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="space-y-5">
      <div>
        <label htmlFor="business-name" className="mb-1.5 block text-sm font-medium text-slate-700">Business name <span aria-hidden="true" className="text-emerald-600">*</span></label>
        <input id="business-name" placeholder="e.g. Amina's Kitchen" autoComplete="organization" maxLength={100} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'business-name-error' : undefined} className={inputClass} {...register('name')} />
        {errors.name && <p id="business-name-error" role="alert" className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="business-category" className="mb-1.5 block text-sm font-medium text-slate-700">Business category <span aria-hidden="true" className="text-emerald-600">*</span></label>
        <select id="business-category" aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? 'business-category-error' : undefined} className={inputClass} {...register('category')}>
          <option value="">Choose a category</option>
          {BUSINESS_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        {errors.category && <p id="business-category-error" role="alert" className="mt-1.5 text-xs text-red-600">{errors.category.message}</p>}
      </div>
      <div>
        <label htmlFor="business-description" className="mb-1.5 block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></label>
        <textarea id="business-description" rows={4} maxLength={500} placeholder="What does your business do?" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'business-description-error' : undefined} className={`${inputClass} resize-y py-3`} {...register('description')} />
        {errors.description && <p id="business-description-error" role="alert" className="mt-1.5 text-xs text-red-600">{errors.description.message}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="business-location" className="mb-1.5 block text-sm font-medium text-slate-700">Business location <span className="font-normal text-slate-400">(optional)</span></label>
          <input id="business-location" placeholder="e.g. Kuala Lumpur" maxLength={120} aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? 'business-location-error' : undefined} className={inputClass} {...register('location')} />
          {errors.location && <p id="business-location-error" role="alert" className="mt-1.5 text-xs text-red-600">{errors.location.message}</p>}
        </div>
        <div>
          <label htmlFor="business-currency" className="mb-1.5 block text-sm font-medium text-slate-700">Currency</label>
          <input id="business-currency" readOnly aria-readonly="true" className={`${inputClass} bg-slate-50 text-slate-600`} {...register('currency')} />
          <p className="mt-1.5 text-xs text-slate-400">Fixed to Malaysian Ringgit for now.</p>
        </div>
      </div>
      {submitError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
      <button type="submit" disabled={isSubmitting} className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        {isSubmitting ? 'Saving business…' : submitLabel}
      </button>
    </form>
  )
}
