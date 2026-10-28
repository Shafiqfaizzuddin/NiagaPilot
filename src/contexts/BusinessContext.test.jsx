// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { BusinessProvider } from './BusinessContext'
import { useBusiness } from '../hooks/useBusiness'
import { useAuth } from '../hooks/useAuth'
import { createBusiness, getBusinesses, updateBusiness } from '../services/businessService'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../services/businessService', () => ({
  createBusiness: vi.fn(), getBusinesses: vi.fn(), updateBusiness: vi.fn(),
}))

const business = {
  id: 'business-1', name: "Amina's Kitchen", category: 'Food & Beverage',
  description: '', location: '', currency: 'MYR',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ currentUser: { uid: 'owner-1' }, loading: false })
  vi.mocked(getBusinesses).mockResolvedValue([business])
})

afterEach(cleanup)

describe('BusinessProvider', () => {
  it('loads the active business from the authenticated user on each mount', async () => {
    const first = renderHook(() => useBusiness(), { wrapper: BusinessProvider })
    expect(first.result.current.businessLoading).toBe(true)
    await waitFor(() => expect(first.result.current.activeBusiness).toEqual(business))
    first.unmount()
    const refreshed = renderHook(() => useBusiness(), { wrapper: BusinessProvider })
    await waitFor(() => expect(refreshed.result.current.activeBusiness).toEqual(business))
    expect(getBusinesses).toHaveBeenCalledTimes(2)
  })

  it('creates one active business and rejects a duplicate submission', async () => {
    vi.mocked(getBusinesses).mockResolvedValue([])
    let finishCreate
    vi.mocked(createBusiness).mockImplementation(() => new Promise((resolve) => { finishCreate = resolve }))
    const { result } = renderHook(() => useBusiness(), { wrapper: BusinessProvider })
    await waitFor(() => expect(result.current.businessLoading).toBe(false))
    let firstRequest
    await act(async () => {
      firstRequest = result.current.createActiveBusiness({ name: business.name })
      await expect(result.current.createActiveBusiness({ name: business.name })).rejects.toThrow('already being saved')
      finishCreate(business)
      await firstRequest
    })
    expect(createBusiness).toHaveBeenCalledOnce()
    expect(result.current.activeBusiness).toEqual(business)
  })

  it('updates the active business in context', async () => {
    vi.mocked(updateBusiness).mockResolvedValue({ ...business, name: 'Amina Market' })
    const { result } = renderHook(() => useBusiness(), { wrapper: BusinessProvider })
    await waitFor(() => expect(result.current.activeBusiness).toEqual(business))
    await act(async () => result.current.updateActiveBusiness({ name: 'Amina Market' }))
    expect(updateBusiness).toHaveBeenCalledWith('business-1', { name: 'Amina Market' })
    expect(result.current.activeBusiness.name).toBe('Amina Market')
  })

  it('does not expose the previous account business during an account switch', async () => {
    const view = renderHook(() => useBusiness(), { wrapper: BusinessProvider })
    await waitFor(() => expect(view.result.current.activeBusiness).toEqual(business))
    vi.mocked(useAuth).mockReturnValue({ currentUser: { uid: 'owner-2' }, loading: false })
    vi.mocked(getBusinesses).mockResolvedValue([])
    view.rerender()
    expect(view.result.current.activeBusiness).toBeNull()
    await waitFor(() => expect(view.result.current.businessLoading).toBe(false))
    expect(view.result.current.activeBusiness).toBeNull()
  })
})
