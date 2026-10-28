import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestore = vi.hoisted(() => ({
  addDoc: vi.fn(), collection: vi.fn(), deleteDoc: vi.fn(), doc: vi.fn(), getDoc: vi.fn(),
  getDocs: vi.fn(), onSnapshot: vi.fn(), query: vi.fn(), serverTimestamp: vi.fn(), updateDoc: vi.fn(), where: vi.fn(),
}))
vi.mock('../config/firebase', () => ({ auth: { currentUser: { uid: 'owner-1' } }, db: { name: 'db' } }))
vi.mock('firebase/firestore', () => firestore)

import { auth, db } from '../config/firebase'
import { createExpense, deleteExpense, getExpenseById, getExpenses, subscribeToExpenses, updateExpense } from './expenseService'

const input = { description: 'Oil', amount: '25.50', category: 'Ingredients', transactionDate: '2026-10-28', paymentMethod: 'Cash', merchant: '', notes: '' }
const saved = { businessId: 'business-1', description: 'Oil', amountCents: 2550, category: 'Ingredients', transactionDate: '2026-10-28', paymentMethod: 'Cash', merchant: '', notes: '', source: 'manual' }
const businessSnapshot = { exists: () => true, data: () => ({ name: 'Amina Market' }) }
const expenseSnapshot = { exists: () => true, id: 'expense-1', data: () => saved }

beforeEach(() => {
  vi.clearAllMocks()
  auth.currentUser = { uid: 'owner-1' }
  firestore.collection.mockImplementation((_, ...parts) => ({ path: parts.join('/') }))
  firestore.doc.mockImplementation((_, ...parts) => ({ path: parts.join('/') }))
  firestore.getDoc.mockImplementation(async (reference) => reference.path.includes('businesses') ? businessSnapshot : expenseSnapshot)
  firestore.getDocs.mockResolvedValue({ docs: [{ id: 'expense-1', data: () => saved }] })
  firestore.addDoc.mockResolvedValue({ id: 'expense-1' })
  firestore.serverTimestamp.mockReturnValue('server-time')
  firestore.where.mockReturnValue('business-filter')
  firestore.query.mockReturnValue('filtered-query')
  firestore.updateDoc.mockResolvedValue(undefined)
  firestore.deleteDoc.mockResolvedValue(undefined)
})

describe('user-owned expense service', () => {
  it('creates exact cents under the authenticated UID and verifies the business', async () => {
    await expect(createExpense('business-1', input)).resolves.toBe('expense-1')
    expect(firestore.doc).toHaveBeenCalledWith(db, 'users', 'owner-1', 'businesses', 'business-1')
    expect(firestore.addDoc).toHaveBeenCalledWith({ path: 'users/owner-1/expenses' }, { ...saved, createdAt: 'server-time', updatedAt: 'server-time' })
  })
  it('queries only the active business and reloads a single expense', async () => {
    expect(await getExpenses('business-1')).toMatchObject([{ id: 'expense-1', businessId: 'business-1' }])
    expect(firestore.where).toHaveBeenCalledWith('businessId', '==', 'business-1')
    expect(await getExpenseById('business-1', 'expense-1')).toMatchObject(saved)
  })
  it('edits only mutable fields and verifies ownership before deletion', async () => {
    await updateExpense('business-1', 'expense-1', { ...input, amount: '10.20' })
    expect(firestore.updateDoc).toHaveBeenCalledWith({ path: 'expense-1' }, expect.objectContaining({ amountCents: 1020, updatedAt: 'server-time' }))
    expect(firestore.updateDoc.mock.calls[0][1]).not.toHaveProperty('businessId')
    await deleteExpense('business-1', 'expense-1')
    expect(firestore.deleteDoc).toHaveBeenCalledWith({ path: 'expense-1' })
  })
  it('rejects missing or foreign businesses and expenses', async () => {
    firestore.getDoc.mockResolvedValueOnce({ exists: () => false })
    await expect(createExpense('business-1', input)).rejects.toThrow('business is not available')
    firestore.getDoc.mockImplementation(async (reference) => reference.path.includes('businesses') ? businessSnapshot : { exists: () => true, data: () => ({ ...saved, businessId: 'business-2' }) })
    await expect(deleteExpense('business-1', 'expense-1')).rejects.toThrow('another business')
    expect(firestore.deleteDoc).not.toHaveBeenCalled()
    auth.currentUser = null
    await expect(getExpenses('business-1')).rejects.toThrow('Sign in')
  })
  it('cleans up real-time listeners and reports permission errors', async () => {
    const onData = vi.fn()
    const onError = vi.fn()
    const unsubscribe = vi.fn()
    firestore.onSnapshot.mockImplementation((_, next, error) => {
      next({ docs: [{ id: 'expense-1', data: () => saved }] })
      error({ code: 'permission-denied' })
      return unsubscribe
    })
    const stop = subscribeToExpenses('business-1', onData, onError)
    await vi.waitFor(() => expect(onData).toHaveBeenCalledWith([{ id: 'expense-1', ...saved }]))
    expect(onError).toHaveBeenCalledWith({ code: 'permission-denied' })
    stop()
    expect(unsubscribe).toHaveBeenCalled()
  })
})
