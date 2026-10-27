import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { FormField } from '../../components/common/FormField'
import { useAuth } from '../../hooks/useAuth'
import { registerUser } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'
import { registerSchema } from '../../validations/authSchemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const { user, isFirebaseConfigured } = useAuth()
  const [submitError, setSubmitError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema) })
  if (user) return <Navigate to="/dashboard" replace />

  async function onSubmit({ name, email, password }) {
    setSubmitError('')
    try {
      await registerUser({ name, email, password })
      navigate('/business/setup')
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error))
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start building a clearer view of your business.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Your name" name="name" placeholder="Your full name" autoComplete="name" register={register} error={errors.name} />
        <FormField label="Email address" name="email" type="email" placeholder="you@business.com" autoComplete="email" register={register} error={errors.email} />
        <FormField label="Password" name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" register={register} error={errors.password} />
        <FormField label="Confirm password" name="confirmPassword" type="password" placeholder="Enter password again" autoComplete="new-password" register={register} error={errors.confirmPassword} />
        {submitError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
        <button type="submit" disabled={!isFirebaseConfigured || isSubmitting} className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-emerald-700 hover:underline">Sign in</Link></p>
    </AuthLayout>
  )
}
