import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from './authErrors'

describe('authentication setup errors', () => {
  it('explains a missing Firebase Authentication project configuration', () => {
    expect(getAuthErrorMessage({ code: 'auth/configuration-not-found' })).toContain('enable Email/Password')
    expect(getAuthErrorMessage({ message: 'CONFIGURATION_NOT_FOUND' })).toContain('Firebase Authentication is not set up')
  })

  it('explains Firestore unavailability and how an already-created account can recover', () => {
    expect(getAuthErrorMessage({ code: 'unavailable' })).toContain('(default) database')
    const message = getAuthErrorMessage({ code: 'profile-save-failed', cause: { code: 'unavailable' } })
    expect(message).toContain('Your account was created')
    expect(message).toContain('sign in with the same email')
  })

  it('explains a denied profile read after database creation', () => {
    expect(getAuthErrorMessage({ code: 'permission-denied' })).toContain('publish the project\'s firestore.rules')
  })
})
