// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { useExpenses } from './useExpenses'
import { subscribeToExpenses } from '../services/expenseService'

vi.mock('../services/expenseService', () => ({ subscribeToExpenses: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks() })

function Probe({ businessId }) {
  const { expenses, loading, error } = useExpenses(businessId)
  return <p>{loading ? 'Loading' : error ? 'Error' : `${businessId}: ${expenses.length}`}</p>
}

it('subscribes again after refresh or business change and cleans up the previous listener', () => {
  const stop = vi.fn()
  vi.mocked(subscribeToExpenses).mockImplementation((businessId, onData) => {
    onData([{ id: `${businessId}-expense` }])
    return stop
  })
  const view = render(<Probe businessId="business-1" />)
  expect(screen.getByText('business-1: 1')).toBeTruthy()
  view.rerender(<Probe businessId="business-2" />)
  expect(stop).toHaveBeenCalledTimes(1)
  expect(screen.getByText('business-2: 1')).toBeTruthy()
  view.unmount()
  expect(stop).toHaveBeenCalledTimes(2)
  render(<Probe businessId="business-1" />)
  expect(subscribeToExpenses).toHaveBeenCalledTimes(3)
})
