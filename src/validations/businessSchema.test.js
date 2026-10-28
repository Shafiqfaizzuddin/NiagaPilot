import { describe, expect, it } from 'vitest'
import { businessSchema } from './businessSchema'

const validBusiness = {
  name: 'Amina Market',
  category: 'Retail',
  description: '',
  location: '',
  currency: 'MYR',
}

describe('business profile validation', () => {
  it('accepts a complete MYR business profile', () => {
    expect(businessSchema.safeParse(validBusiness).success).toBe(true)
  })

  it('rejects missing names, unsupported categories, and other currencies', () => {
    expect(businessSchema.safeParse({ ...validBusiness, name: ' ' }).success).toBe(false)
    expect(businessSchema.safeParse({ ...validBusiness, category: 'Unlisted' }).success).toBe(false)
    expect(businessSchema.safeParse({ ...validBusiness, currency: 'USD' }).success).toBe(false)
  })

  it('limits unusually long descriptions and locations', () => {
    expect(businessSchema.safeParse({ ...validBusiness, description: 'a'.repeat(501) }).success).toBe(false)
    expect(businessSchema.safeParse({ ...validBusiness, location: 'a'.repeat(121) }).success).toBe(false)
  })
})
