import { useCallback, useEffect, useRef, useState } from 'react'
import { auth, isFirebaseConfigured } from '../config/firebase'
import { loginUser, logoutUser, observeAuth, registerUser } from '../services/authService'
import { createUserProfile, ensureUserProfile } from '../services/profileService'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }) {
  const [session, setSession] = useState({
    currentUser: null,
    userProfile: null,
    loading: isFirebaseConfigured,
    error: null,
  })
  const requestId = useRef(0)
  const authOperation = useRef(false)

  const resolveSession = useCallback(async (user) => {
    const currentRequest = ++requestId.current
    if (!user) {
      setSession({ currentUser: null, userProfile: null, loading: false, error: null })
      return null
    }
    setSession((previous) => ({ ...previous, loading: true, error: null }))
    try {
      const userProfile = await ensureUserProfile(user)
      if (currentRequest === requestId.current) {
        setSession({ currentUser: user, userProfile, loading: false, error: null })
      }
      return userProfile
    } catch (error) {
      if (currentRequest === requestId.current) {
        setSession({ currentUser: user, userProfile: null, loading: false, error })
      }
      throw error
    }
  }, [])

  useEffect(() => {
    const unsubscribe = observeAuth(
      (user) => {
        if (!authOperation.current) void resolveSession(user).catch(() => {})
      },
      (error) => setSession((previous) => ({ ...previous, loading: false, error })),
    )
    return () => { requestId.current += 1; unsubscribe() }
  }, [resolveSession])

  async function register(values) {
    authOperation.current = true
    let accountCreated = false
    try {
      const user = await registerUser(values)
      accountCreated = true
      await createUserProfile(user, values.fullName)
      await resolveSession(user)
      return user
    } catch (error) {
      if (accountCreated) await logoutUser().catch(() => {})
      await resolveSession(null)
      if (accountCreated) {
        throw Object.assign(new Error('The account was created, but its profile could not be loaded.'), {
          code: 'profile-save-failed', cause: error,
        })
      }
      throw error
    } finally {
      authOperation.current = false
    }
  }

  async function login(values) {
    authOperation.current = true
    try {
      const user = await loginUser(values)
      await resolveSession(user)
      return { user }
    } finally {
      authOperation.current = false
    }
  }

  async function logout() {
    await logoutUser()
    await resolveSession(null)
  }

  async function retrySession() {
    return resolveSession(auth?.currentUser || null)
  }

  const value = {
    ...session,
    isFirebaseConfigured,
    register,
    login,
    logout,
    retrySession,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
