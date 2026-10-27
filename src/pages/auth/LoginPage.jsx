import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { FormField } from '../../components/common/FormField'
import { useAuth } from '../../hooks/useAuth'
import { loginUser } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'
import { loginSchema } from '../../validations/authSchemas'

export function LoginPage() {
  const navigate = useNavigate()
  const { user, isFirebaseConfigured } = useAuth()
  const [submitError, setSubmitError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) })
  if (user) return <Navigate to="/dashboard" replace />

  async function onSubmit(values) {
    setSubmitError('')
    try {
      await loginUser(values)
      navigate('/dashboard')
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error))
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your business workspace.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Email address" name="email" type="email" placeholder="you@business.com" autoComplete="email" register={register} error={errors.email} />
        <FormField label="Password" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" register={register} error={errors.password} />
        {submitError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
        <button type="submit" disabled={!isFirebaseConfigured || isSubmitting} className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">New to NiagaPilot AI? <Link to="/register" className="font-semibold text-emerald-700 hover:underline">Create an account</Link></p>
      {!isFirebaseConfigured && <p className="mt-4 text-center text-xs text-slate-400">You can <Link to="/dashboard" className="font-semibold text-emerald-700 underline">preview the dashboard</Link> while configuring Firebase.</p>}
    </AuthLayout>
  )
}
