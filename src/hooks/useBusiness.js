import { useContext } from 'react'
import { BusinessContext } from '../contexts/businessContextValue'

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (!context) throw new Error('useBusiness must be used inside BusinessProvider')
  return context
}
