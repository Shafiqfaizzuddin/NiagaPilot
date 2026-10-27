import { useEffect, useMemo, useState } from 'react'
import { isFirebaseConfigured } from '../config/firebase'
import { observeAuth } from '../services/authService'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    return observeAuth((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
  }, [])

  const value = useMemo(() => ({ user, loading, isFirebaseConfigured }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
