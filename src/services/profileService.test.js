import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestore = vi.hoisted(() => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))

vi.mock('../config/firebase', () => ({ auth: { currentUser: { uid: 'user-1' } }, db: { name: 'test-db' } }))
vi.mock('firebase/firestore', () => firestore)

import { createUserProfile, getUserProfile } from './profileService'
import { auth, db } from '../config/firebase'

beforeEach(() => {
  vi.clearAllMocks()
  auth.currentUser = { uid: 'user-1' }
  firestore.doc.mockReturnValue('profile-reference')
  firestore.serverTimestamp.mockReturnValue('server-timestamp')
  firestore.setDoc.mockResolvedValue(undefined)
})

describe('Firestore user profiles', () => {
  it('writes only requested fields under the owner UID', async () => {
    const user = { uid: 'user-1', email: 'amina@example.com' }
    await createUserProfile(user, ' Amina Hassan ')
    expect(firestore.doc).toHaveBeenCalledWith(db, 'users', user.uid)
    expect(firestore.setDoc).toHaveBeenCalledWith('profile-reference', {
      uid: user.uid,
      fullName: 'Amina Hassan',
      email: user.email,
      createdAt: 'server-timestamp',
      updatedAt: 'server-timestamp',
    })
    expect(firestore.serverTimestamp).toHaveBeenCalledTimes(2)
  })

  it('loads only the requested user document', async () => {
    firestore.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ uid: 'user-1' }) })
    await expect(getUserProfile()).resolves.toEqual({ uid: 'user-1' })
    expect(firestore.doc).toHaveBeenCalledWith(db, 'users', 'user-1')
  })

  it('does not accept a different user object or an unauthenticated read', async () => {
    await expect(createUserProfile({ uid: 'user-2', email: 'other@example.com' }, 'Other User')).rejects.toThrow('account changed')
    auth.currentUser = null
    await expect(getUserProfile()).rejects.toThrow('Sign in')
  })
})
