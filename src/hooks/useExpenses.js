import { useEffect, useState } from 'react'
import { subscribeToExpenses } from '../services/expenseService'

export function useExpenses(businessId) {
  const [state, setState] = useState({ businessId: null, expenses: [], loading: true, error: null })
  useEffect(() => {
    if (!businessId) return undefined
    return subscribeToExpenses(businessId,
      (expenses) => setState({ businessId, expenses, loading: false, error: null }),
      (error) => setState({ businessId, expenses: [], loading: false, error }),
    )
  }, [businessId])
  if (state.businessId !== businessId) return { expenses: [], loading: true, error: null }
  return state
}
