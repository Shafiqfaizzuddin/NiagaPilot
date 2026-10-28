import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestore = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
}))

vi.mock('../config/firebase', () => ({
  auth: { currentUser: { uid: 'owner-1' } },
  db: { name: 'test-db' },
}))
vi.mock('firebase/firestore', () => firestore)

import { auth, db } from '../config/firebase'
import { createBusiness, getBusinesses, getBusinessById, updateBusiness } from './businessService'

const input = {
  name: "Amina's Kitchen", category: 'Food & Beverage', description: 'Fresh meals',
  location: 'Kuala Lumpur', currency: 'MYR',
}
const business = { id: 'business-1', ...input, createdAt: { toMillis: () => 1 } }

beforeEach(() => {
  vi.clearAllMocks()
  auth.currentUser = { uid: 'owner-1' }
  firestore.collection.mockReturnValue({ path: 'users/owner-1/businesses' })
  firestore.doc.mockImplementation((_, id) => ({ id }))
  firestore.addDoc.mockResolvedValue({ id: 'business-1' })
  firestore.getDoc.mockResolvedValue({ id: 'business-1', exists: () => true, data: () => business })
  firestore.getDocs.mockResolvedValue({ docs: [{ id: 'business-1', data: () => business }] })
  firestore.serverTimestamp.mockReturnValue('server-timestamp')
  firestore.updateDoc.mockResolvedValue(undefined)
})

describe('user-owned business service', () => {
  it('creates a validated business beneath the signed-in user', async () => {
    await expect(createBusiness(input)).resolves.toMatchObject({ id: 'business-1', name: input.name })
    expect(firestore.collection).toHaveBeenCalledWith(db, 'users', 'owner-1', 'businesses')
    expect(firestore.addDoc).toHaveBeenCalledWith(
      { path: 'users/owner-1/businesses' },
      { ...input, createdAt: 'server-timestamp', updatedAt: 'server-timestamp' },
    )
  })

  it('loads only the signed-in user collection and business ID', async () => {
    await expect(getBusinesses()).resolves.toHaveLength(1)
    await expect(getBusinessById('business-1')).resolves.toMatchObject({ id: 'business-1' })
    expect(firestore.collection).toHaveBeenCalledWith(db, 'users', 'owner-1', 'businesses')
    expect(firestore.doc).toHaveBeenCalledWith({ path: 'users/owner-1/businesses' }, 'business-1')
    await expect(getBusinessById('../other-user')).rejects.toThrow('Invalid business ID.')
  })

  it('updates only editable fields and keeps MYR and the document ID unchanged', async () => {
    await updateBusiness('business-1', { ...input, name: 'Amina Market' })
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      { id: 'business-1' },
      {
        name: 'Amina Market', category: 'Food & Beverage', description: 'Fresh meals',
        location: 'Kuala Lumpur', updatedAt: 'server-timestamp',
      },
    )
    await expect(updateBusiness('business-1', { ...input, currency: 'USD' })).rejects.toThrow()
  })

  it('cannot use a caller-provided UID or work without an authenticated user', async () => {
    auth.currentUser = { uid: 'owner-2' }
    await getBusinesses()
    expect(firestore.collection).toHaveBeenCalledWith(db, 'users', 'owner-2', 'businesses')
    auth.currentUser = null
    await expect(getBusinesses()).rejects.toThrow('Sign in to manage your business.')
  })

  it('rejects invalid business details before writing', async () => {
    await expect(createBusiness({ ...input, category: 'Unlisted' })).rejects.toThrow()
    await expect(createBusiness({ ...input, name: ' ' })).rejects.toThrow()
    expect(firestore.addDoc).not.toHaveBeenCalled()
  })
})
