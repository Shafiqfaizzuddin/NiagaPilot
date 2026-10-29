import { describe, expect, it } from 'vitest'
import { saleFormSchema, toSaleFields } from './saleSchema'

const valid = { description: ' Lunch orders ', amount: '25.50', transactionDate: '2026-10-28', paymentMethod: 'Cash', customer: ' Amina ', notes: ' Paid ' }

describe('sales validation', () => {
  it('trims text and converts validated RM input to integer cents', () => {
    expect(toSaleFields(valid)).toMatchObject({ description: 'Lunch orders', amountCents: 2550, customer: 'Amina', notes: 'Paid' })
  })
  it('rejects invalid money, dates, and long text', () => {
    for (const amount of ['', '-1', '0', '2.345', 'NaN', 'Infinity']) {
      expect(saleFormSchema.safeParse({ ...valid, amount }).success).toBe(false)
    }
    expect(saleFormSchema.safeParse({ ...valid, transactionDate: '2026-02-30' }).success).toBe(false)
    expect(saleFormSchema.safeParse({ ...valid, notes: 'x'.repeat(501) }).success).toBe(false)
    expect(saleFormSchema.safeParse({ ...valid, description: '   ' }).success).toBe(false)
  })
})
