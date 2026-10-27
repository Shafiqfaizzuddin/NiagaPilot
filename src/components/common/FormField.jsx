export function FormField({ label, name, type = 'text', placeholder, register, error, autoComplete }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input id={name} type={type} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 aria-invalid:border-red-400"
        {...register(name)} />
      {error && <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs text-red-600">{error.message}</p>}
    </div>
  )
}
