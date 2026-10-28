import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { AuthError } from '../components/common/AuthError'
import { AuthLoading } from '../components/common/AuthLoading'
import { BusinessLoadState } from '../components/common/BusinessLoadState'
import { useBusiness } from '../hooks/useBusiness'

export function ProtectedRoute() {
  const { currentUser, loading, error } = useAuth()
  if (loading) return <AuthLoading />
  if (error) return <AuthError />
  if (!currentUser) return <Navigate to="/login" replace />
  return <Outlet />
}

export function BusinessRequiredRoute() {
  const { activeBusiness, businessLoading, businessError } = useBusiness()
  if (businessLoading) return <AuthLoading />
  if (businessError) return <BusinessLoadState />
  if (!activeBusiness) return <Navigate to="/business/setup" replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { currentUser, loading, error } = useAuth()
  const { activeBusiness, businessLoading, businessError } = useBusiness()
  if (loading) return <AuthLoading />
  if (error && currentUser) return <AuthError />
  if (currentUser && businessLoading) return <AuthLoading />
  if (currentUser && businessError) return <BusinessLoadState />
  if (currentUser) return <Navigate to={activeBusiness ? '/dashboard' : '/business/setup'} replace />
  return <Outlet />
}
