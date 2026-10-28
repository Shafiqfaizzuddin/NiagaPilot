import { useCallback, useEffect, useRef, useState } from 'react'
import { createBusiness, getBusinesses, updateBusiness } from '../services/businessService'
import { useAuth } from '../hooks/useAuth'
import { BusinessContext } from './businessContextValue'

const emptyBusinessState = {
  uid: null,
  businesses: [],
  activeBusiness: null,
  loading: false,
  error: null,
}

export function BusinessProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth()
  const uid = currentUser?.uid || null
  const [state, setState] = useState(emptyBusinessState)
  const requestId = useRef(0)
  const createInFlight = useRef(false)
  const updateInFlight = useRef(false)

  const refreshBusiness = useCallback(async () => {
    const currentRequest = ++requestId.current
    if (!uid) {
      setState(emptyBusinessState)
      return null
    }
    setState((previous) => ({ ...previous, uid, loading: true, error: null }))
    try {
      const businesses = await getBusinesses()
      if (currentRequest !== requestId.current) return null
      const activeBusiness = businesses[0] || null
      setState({ uid, businesses, activeBusiness, loading: false, error: null })
      return activeBusiness
    } catch (error) {
      if (currentRequest === requestId.current) {
        setState({ uid, businesses: [], activeBusiness: null, loading: false, error })
      }
      throw error
    }
  }, [uid])

  useEffect(() => {
    void Promise.resolve().then(refreshBusiness).catch(() => {})
    return () => { requestId.current += 1 }
  }, [refreshBusiness])

  async function createActiveBusiness(values) {
    if (!uid || state.uid !== uid || state.loading) throw new Error('Your business workspace is still loading.')
    if (state.activeBusiness) throw new Error('A business profile already exists.')
    if (createInFlight.current) throw new Error('Your business is already being saved.')
    createInFlight.current = true
    try {
      const business = await createBusiness(values)
      setState((previous) => previous.uid === uid
        ? { uid, businesses: [business], activeBusiness: business, loading: false, error: null }
        : previous)
      return business
    } finally {
      createInFlight.current = false
    }
  }

  async function updateActiveBusiness(values) {
    if (!state.activeBusiness) throw new Error('No active business is available.')
    if (updateInFlight.current) throw new Error('Your changes are already being saved.')
    updateInFlight.current = true
    try {
      const business = await updateBusiness(state.activeBusiness.id, values)
      setState((previous) => previous.uid === uid ? {
        ...previous,
        businesses: previous.businesses.map((item) => item.id === business.id ? business : item),
        activeBusiness: business,
        error: null,
      } : previous)
      return business
    } finally {
      updateInFlight.current = false
    }
  }

  const value = {
    activeBusiness: state.uid === uid && !authLoading ? state.activeBusiness : null,
    businessLoading: authLoading || (Boolean(uid) && state.uid !== uid) || state.loading,
    businessError: state.uid === uid ? state.error : null,
    refreshBusiness,
    createActiveBusiness,
    updateActiveBusiness,
  }
  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
}
