import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { user, loading, isFirebaseConfigured } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center text-slate-500">Loading your workspace…</div>
  if (isFirebaseConfigured && !user) return <Navigate to="/login" replace />
  return <Outlet />
}
