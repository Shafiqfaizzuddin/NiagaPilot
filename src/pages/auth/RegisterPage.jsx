import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { FormField } from '../../components/common/FormField'
import { useAuth } from '../../hooks/useAuth'
import { getAuthErrorMessage } from '../../utils/authErrors'
import { registerSchema } from '../../validations/authSchemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerAccount, isFirebaseConfigured } = useAuth()
  const [submitError, setSubmitError] = useState('')
  const { register: registerField, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema) })

  async function onSubmit({ fullName, email, password }) {
    setSubmitError('')
    try {
      await registerAccount({ fullName, email, password })
      navigate('/business/setup', { replace: true })
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error))
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start building a clearer view of your business.">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Full name" name="fullName" placeholder="Your full name" autoComplete="name" register={registerField} error={errors.fullName} />
        <FormField label="Email address" name="email" type="email" placeholder="you@business.com" autoComplete="email" register={registerField} error={errors.email} />
        <FormField label="Password" name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" register={registerField} error={errors.password} />
        <FormField label="Confirm password" name="confirmPassword" type="password" placeholder="Enter password again" autoComplete="new-password" register={registerField} error={errors.confirmPassword} />
        {submitError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
        <button type="submit" disabled={!isFirebaseConfigured || isSubmitting} className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-emerald-700 hover:underline">Sign in</Link></p>
    </AuthLayout>
  )
}
