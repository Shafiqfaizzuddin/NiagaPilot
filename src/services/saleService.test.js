import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestore = vi.hoisted(() => ({
  addDoc: vi.fn(), collection: vi.fn(), deleteDoc: vi.fn(), doc: vi.fn(), getDoc: vi.fn(),
  getDocs: vi.fn(), onSnapshot: vi.fn(), query: vi.fn(), serverTimestamp: vi.fn(), updateDoc: vi.fn(), where: vi.fn(),
}))
vi.mock('../config/firebase', () => ({ auth: { currentUser: { uid: 'owner-1' } }, db: { name: 'db' } }))
vi.mock('firebase/firestore', () => firestore)

import { auth, db } from '../config/firebase'
import { createSale, deleteSale, getSaleById, getSales, subscribeToSales, updateSale } from './saleService'

const input = { description: 'Lunch', amount: '25.50', transactionDate: '2026-10-28', paymentMethod: 'Cash', customer: '', notes: '' }
const saved = { businessId: 'business-1', description: 'Lunch', amountCents: 2550, transactionDate: '2026-10-28', paymentMethod: 'Cash', customer: '', notes: '', source: 'manual' }
const businessSnapshot = { exists: () => true }
const saleSnapshot = { exists: () => true, id: 'sale-1', data: () => saved }

beforeEach(() => {
  vi.clearAllMocks()
  auth.currentUser = { uid: 'owner-1' }
  firestore.collection.mockImplementation((_, ...parts) => ({ path: parts.join('/') }))
  firestore.doc.mockImplementation((_, ...parts) => ({ path: parts.join('/') }))
  firestore.getDoc.mockImplementation(async (reference) => reference.path.includes('businesses') ? businessSnapshot : saleSnapshot)
  firestore.getDocs.mockResolvedValue({ docs: [{ id: 'sale-1', data: () => saved }] })
  firestore.addDoc.mockResolvedValue({ id: 'sale-1' })
  firestore.serverTimestamp.mockReturnValue('server-time')
  firestore.where.mockReturnValue('business-filter')
  firestore.query.mockReturnValue('filtered-query')
  firestore.updateDoc.mockResolvedValue(undefined)
  firestore.deleteDoc.mockResolvedValue(undefined)
})

describe('user-owned sales service', () => {
  it('creates integer cents under the authenticated UID and verified business', async () => {
    await expect(createSale('business-1', input)).resolves.toBe('sale-1')
    expect(firestore.doc).toHaveBeenCalledWith(db, 'users', 'owner-1', 'businesses', 'business-1')
    expect(firestore.addDoc).toHaveBeenCalledWith({ path: 'users/owner-1/sales' }, { ...saved, createdAt: 'server-time', updatedAt: 'server-time' })
  })
  it('queries only the active business and loads one sale', async () => {
    expect(await getSales('business-1')).toMatchObject([{ id: 'sale-1', businessId: 'business-1' }])
    expect(firestore.where).toHaveBeenCalledWith('businessId', '==', 'business-1')
    expect(await getSaleById('business-1', 'sale-1')).toMatchObject(saved)
  })
  it('edits mutable fields and verifies ownership before deletion', async () => {
    await updateSale('business-1', 'sale-1', { ...input, amount: '10.20' })
    expect(firestore.updateDoc).toHaveBeenCalledWith({ path: 'sale-1' }, expect.objectContaining({ amountCents: 1020, updatedAt: 'server-time' }))
    expect(firestore.updateDoc.mock.calls[0][1]).not.toHaveProperty('businessId')
    await deleteSale('business-1', 'sale-1')
    expect(firestore.deleteDoc).toHaveBeenCalledWith({ path: 'sale-1' })
  })
  it('rejects foreign businesses, foreign sales, and unauthenticated access', async () => {
    firestore.getDoc.mockResolvedValueOnce({ exists: () => false })
    await expect(createSale('business-1', input)).rejects.toThrow('business is not available')
    firestore.getDoc.mockImplementation(async (reference) => reference.path.includes('businesses') ? businessSnapshot : { exists: () => true, data: () => ({ ...saved, businessId: 'business-2' }) })
    await expect(deleteSale('business-1', 'sale-1')).rejects.toThrow('another business')
    expect(firestore.deleteDoc).not.toHaveBeenCalled()
    auth.currentUser = null
    await expect(getSales('business-1')).rejects.toThrow('Sign in')
  })
  it('cleans up the real-time listener', async () => {
    const onData = vi.fn(), onError = vi.fn(), unsubscribe = vi.fn()
    firestore.onSnapshot.mockImplementation((_, next) => { next({ docs: [{ id: 'sale-1', data: () => saved }] }); return unsubscribe })
    const stop = subscribeToSales('business-1', onData, onError)
    await vi.waitFor(() => expect(onData).toHaveBeenCalledWith([{ id: 'sale-1', ...saved }]))
    stop()
    expect(unsubscribe).toHaveBeenCalled()
  })
})
