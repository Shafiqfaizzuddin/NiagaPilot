import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './authSchemas'

describe('authentication forms', () => {
  it('rejects malformed email and missing password', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: '' }).success).toBe(false)
  })

  it('requires matching passwords when creating an account', () => {
    expect(registerSchema.safeParse({
      fullName: 'Amina', email: 'amina@example.com', password: 'securepass1', confirmPassword: 'differentpass',
    }).success).toBe(false)
  })

  it('limits profile names to the Firestore rules maximum', () => {
    expect(registerSchema.safeParse({
      fullName: 'A'.repeat(101), email: 'amina@example.com', password: 'securepass1', confirmPassword: 'securepass1',
    }).success).toBe(false)
  })
})
