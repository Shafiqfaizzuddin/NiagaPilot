import { describe, expect, it } from 'vitest'
import { dashboardExpenseStats, expenseTrend, greetingForLocalTime, monthComparison } from './dashboardData'

const now = new Date(2026, 9, 28, 10, 30)
const expenses = [
  { id: 'a', transactionDate: '2026-10-28', amountCents: 2550, category: 'Ingredients' },
  { id: 'b', transactionDate: '2026-10-28', amountCents: 450, category: 'Packaging' },
  { id: 'c', transactionDate: '2026-10-01', amountCents: 2000, category: 'Rent' },
  { id: 'd', transactionDate: '2026-09-30', amountCents: 4000, category: 'Rent' },
  { id: 'e', transactionDate: '2026-08-31', amountCents: 1000, category: 'Other' },
]

describe('dashboard calculations', () => {
  it('uses local time for the greeting', () => {
    expect(greetingForLocalTime(new Date(2026, 9, 28, 9))).toBe('Good morning')
    expect(greetingForLocalTime(new Date(2026, 9, 28, 14))).toBe('Good afternoon')
    expect(greetingForLocalTime(new Date(2026, 9, 28, 21))).toBe('Good evening')
  })
  it('calculates current and previous calendar months using integer cents', () => {
    expect(dashboardExpenseStats(expenses, now)).toEqual({ totalCents: 10000n, thisMonthCents: 5000n, lastMonthCents: 4000n, count: 5 })
    const january = new Date(2027, 0, 5)
    expect(dashboardExpenseStats([{ transactionDate: '2026-12-31', amountCents: 100 }], january).lastMonthCents).toBe(100n)
  })
  it('compares months and handles a zero previous period', () => {
    expect(monthComparison(4500n, 4000n)).toBe('Expenses increased by 12.5% compared to last month.')
    expect(monthComparison(3500n, 4000n)).toBe('Expenses decreased by 12.5% compared to last month.')
    expect(monthComparison(4000n, 4000n)).toBe('Expenses were unchanged compared to last month.')
    expect(monthComparison(100n, 0n)).toBe('No comparable previous-period expenses')
    expect(monthComparison(10001n, 10000n)).toBe('Expenses increased by less than 0.1% compared to last month.')
  })
  it('groups expenses by local transaction date for 7, 30, and month views', () => {
    const seven = expenseTrend(expenses, 'last7', now)
    expect(seven).toHaveLength(7)
    expect(seven[0].date).toBe('2026-10-22')
    expect(seven.at(-1)).toMatchObject({ date: '2026-10-28', amountCents: 3000n })
    expect(expenseTrend(expenses, 'last30', now)).toHaveLength(30)
    const month = expenseTrend(expenses, 'thisMonth', now)
    expect(month).toHaveLength(28)
    expect(month[0]).toMatchObject({ date: '2026-10-01', amountCents: 2000n })
    expect(month.some((day) => day.date === '2026-09-30')).toBe(false)
  })
})
