// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { AuthProvider } from './AuthContext'
import { useAuth } from '../hooks/useAuth'
import { observeAuth, registerUser, loginUser, logoutUser } from '../services/authService'
import { createUserProfile, ensureUserProfile } from '../services/profileService'

vi.mock('../config/firebase', () => ({
  auth: { currentUser: null },
  isFirebaseConfigured: true,
}))
vi.mock('../services/authService', () => ({
  observeAuth: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
}))
vi.mock('../services/profileService', () => ({
  createUserProfile: vi.fn(),
  ensureUserProfile: vi.fn(),
}))

let authCallback
const user = { uid: 'user-1', email: 'amina@example.com', displayName: 'Amina Hassan' }
const profile = { uid: 'user-1', fullName: 'Amina Hassan', email: 'amina@example.com' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(observeAuth).mockImplementation((callback) => {
    authCallback = callback
    return () => {}
  })
  vi.mocked(ensureUserProfile).mockResolvedValue(profile)
  vi.mocked(createUserProfile).mockResolvedValue(profile)
  vi.mocked(logoutUser).mockResolvedValue(undefined)
})

afterEach(cleanup)

describe('AuthProvider', () => {
  it('waits for a restored session and its profiles before rendering protected content', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.loading).toBe(true)
    await act(async () => authCallback(user))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.currentUser).toBe(user)
    expect(result.current.userProfile).toEqual(profile)
  })

  it('creates the Firestore user profile during registration', async () => {
    vi.mocked(registerUser).mockResolvedValue(user)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await act(async () => authCallback(null))
    await act(async () => {
      await result.current.register({ fullName: 'Amina Hassan', email: user.email, password: 'securepass1' })
    })
    expect(createUserProfile).toHaveBeenCalledWith(user, 'Amina Hassan')
    expect(result.current.currentUser).toBe(user)
    expect(result.current.userProfile).toEqual(profile)
  })

  it('signs out if the account is created but its Firestore profile cannot be saved', async () => {
    vi.mocked(registerUser).mockResolvedValue(user)
    vi.mocked(createUserProfile).mockRejectedValue({ code: 'permission-denied' })
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await act(async () => authCallback(null))
    await expect(act(async () => result.current.register({
      fullName: 'Amina Hassan', email: user.email, password: 'securepass1',
    }))).rejects.toMatchObject({ code: 'profile-save-failed', cause: { code: 'permission-denied' } })
    expect(logoutUser).toHaveBeenCalledOnce()
    expect(result.current.currentUser).toBe(null)
  })

  it('restores the user profile on login and clears state on logout', async () => {
    vi.mocked(loginUser).mockResolvedValue(user)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await act(async () => authCallback(null))
    let loginResult
    await act(async () => {
      loginResult = await result.current.login({ email: user.email, password: 'securepass1' })
    })
    expect(loginResult.user).toBe(user)
    expect(result.current.userProfile).toEqual(profile)
    await act(async () => result.current.logout())
    expect(logoutUser).toHaveBeenCalledOnce()
    expect(result.current.currentUser).toBe(null)
  })
})
