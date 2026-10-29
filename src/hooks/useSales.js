import { useEffect, useState } from 'react'
import { subscribeToSales } from '../services/saleService'

export function useSales(businessId) {
  const [state, setState] = useState({ businessId: null, sales: [], loading: true, error: null })
  useEffect(() => {
    if (!businessId) return undefined
    return subscribeToSales(businessId,
      (sales) => setState({ businessId, sales, loading: false, error: null }),
      (error) => setState({ businessId, sales: [], loading: false, error }),
    )
  }, [businessId])
  if (state.businessId !== businessId) return { sales: [], loading: true, error: null }
  return state
}
