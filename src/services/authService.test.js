import { beforeEach, describe, expect, it, vi } from 'vitest'

const firebaseAuth = vi.hoisted(() => ({
  setPersistence: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('../config/firebase', () => ({ auth: { name: 'test-auth' } }))
vi.mock('firebase/auth', () => ({
  browserLocalPersistence: { type: 'LOCAL' },
  ...firebaseAuth,
}))

import { loginUser, logoutUser, observeAuth, registerUser } from './authService'
import { auth } from '../config/firebase'

beforeEach(() => {
  vi.clearAllMocks()
  firebaseAuth.setPersistence.mockResolvedValue(undefined)
})

describe('Firebase Authentication service', () => {
  it('registers with browser persistence', async () => {
    const user = { uid: 'user-1', email: 'amina@example.com' }
    firebaseAuth.createUserWithEmailAndPassword.mockResolvedValue({ user })
    await expect(registerUser({ fullName: 'Amina Hassan', email: user.email, password: 'securepass1' })).resolves.toBe(user)
    expect(firebaseAuth.setPersistence).toHaveBeenCalledWith(auth, { type: 'LOCAL' })
    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, user.email, 'securepass1')
  })

  it('logs in with browser persistence and signs out', async () => {
    const user = { uid: 'user-1' }
    firebaseAuth.signInWithEmailAndPassword.mockResolvedValue({ user })
    await expect(loginUser({ email: 'amina@example.com', password: 'securepass1' })).resolves.toBe(user)
    expect(firebaseAuth.setPersistence).toHaveBeenCalledWith(auth, { type: 'LOCAL' })
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'amina@example.com', 'securepass1')
    await logoutUser()
    expect(firebaseAuth.signOut).toHaveBeenCalledWith(auth)
  })

  it('subscribes to restored authentication state', () => {
    const callback = vi.fn()
    const onError = vi.fn()
    const unsubscribe = vi.fn()
    firebaseAuth.onAuthStateChanged.mockReturnValue(unsubscribe)
    expect(observeAuth(callback, onError)).toBe(unsubscribe)
    expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(auth, callback, onError)
  })
})
