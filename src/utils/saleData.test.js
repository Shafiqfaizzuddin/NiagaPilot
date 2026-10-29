import { describe, expect, it } from 'vitest'
import { saleStats, selectSales } from './saleData'

const sales = [
  { id: 'b', description: 'Lunch orders', customer: 'Amina', notes: 'walk in', paymentMethod: 'Cash', amountCents: 2550, transactionDate: '2026-10-28' },
  { id: 'a', description: 'Tea', customer: '', notes: '', paymentMethod: 'E-Wallet', amountCents: 1000, transactionDate: '2026-10-28' },
  { id: 'c', description: 'Catering', customer: 'Office', notes: '', paymentMethod: 'Bank Transfer', amountCents: 5000, transactionDate: '2026-09-01' },
]

describe('sales calculations and filters', () => {
  it('calculates deterministic integer-cent totals', () => {
    expect(saleStats(sales, new Date(2026, 9, 28))).toEqual({ totalCents: 8550n, monthCents: 3550n, previousMonthCents: 5000n, count: 3 })
  })
  it('searches without case and combines payment filters', () => {
    expect(selectSales(sales, { search: 'AMINA' }).map((item) => item.id)).toEqual(['b'])
    expect(selectSales(sales, { search: 'tea', paymentMethod: 'Cash' })).toEqual([])
    expect(selectSales(sales, { search: 'office', paymentMethod: 'Bank Transfer' }).map((item) => item.id)).toEqual(['c'])
  })
  it('sorts by date and amount with deterministic ties', () => {
    expect(selectSales(sales).map((item) => item.id)).toEqual(['a', 'b', 'c'])
    expect(selectSales(sales, { sort: 'oldest' }).map((item) => item.id)).toEqual(['c', 'a', 'b'])
    expect(selectSales(sales, { sort: 'highest' }).map((item) => item.id)).toEqual(['c', 'b', 'a'])
    expect(selectSales(sales, { sort: 'lowest' }).map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })
})
