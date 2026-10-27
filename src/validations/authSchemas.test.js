import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './authSchemas'

describe('authentication forms', () => {
  it('rejects malformed email and missing password', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: '' }).success).toBe(false)
  })

  it('requires matching passwords when creating an account', () => {
    expect(registerSchema.safeParse({
      name: 'Amina', email: 'amina@example.com', password: 'securepass1', confirmPassword: 'differentpass',
    }).success).toBe(false)
  })
})
