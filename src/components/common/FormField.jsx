import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function FormField({ label, name, type = 'text', placeholder, register, error, autoComplete }) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input id={name} type={isPassword && visible ? 'text' : type} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}
          className={`min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 aria-invalid:border-red-400 ${isPassword ? 'pr-12' : ''}`}
          {...register(name)} />
        {isPassword && <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible}
          className="absolute inset-y-0 right-1 flex min-w-10 items-center justify-center rounded-lg text-slate-500 hover:text-slate-700">
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>}
      </div>
      {error && <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs text-red-600">{error.message}</p>}
    </div>
  )
}
