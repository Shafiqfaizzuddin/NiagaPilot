import { describe, expect, it } from 'vitest'
import { parseRinggitToCents, formatMYR, centsToRinggitInput } from './money'
import { dateRangeForPreset, isValidDateString, localDateString } from './localDates'
import { categoryBreakdown, expenseStats, initialExpenseFilters, selectExpenses } from './expenseData'
import { expenseFormSchema, toExpenseFields } from '../validations/expenseSchema'

const records = [
  { id: 'b', description: 'Cooking Oil', merchant: 'Market A', notes: 'weekly stock', category: 'Ingredients', paymentMethod: 'Cash', transactionDate: '2026-10-28', amountCents: 2550 },
  { id: 'a', description: 'Boxes', merchant: 'Supply Shop', notes: '', category: 'Packaging', paymentMethod: 'E-Wallet', transactionDate: '2026-10-28', amountCents: 500 },
  { id: 'c', description: 'Electricity', merchant: '', notes: 'September bill', category: 'Utilities', paymentMethod: 'Bank Transfer', transactionDate: '2026-09-30', amountCents: 10000 },
]
const today = new Date(2026, 9, 28, 23, 15)

describe('money and validation', () => {
  it('parses decimal text into exact integer cents and formats MYR', () => {
    expect(parseRinggitToCents('25.50')).toBe(2550)
    expect(parseRinggitToCents('0.01')).toBe(1)
    expect(parseRinggitToCents(' 1.2 ')).toBe(120)
    expect(formatMYR(2550)).toBe('RM25.50')
    expect(formatMYR(123456789n)).toBe('RM1,234,567.89')
    expect(centsToRinggitInput(2550)).toBe('25.50')
  })
  it('rejects invalid money and profile fields', () => {
    for (const value of ['0', '-1', '1.234', '1e3', 'RM25.50', '1,000', '9999999999']) {
      expect(() => parseRinggitToCents(value)).toThrow()
    }
    const valid = { description: '  Oil  ', amount: '25.50', category: 'Ingredients', transactionDate: '2026-10-28', paymentMethod: '', merchant: '  Market  ', notes: '  stock  ' }
    expect(toExpenseFields(valid)).toMatchObject({ description: 'Oil', amountCents: 2550, merchant: 'Market', notes: 'stock' })
    expect(expenseFormSchema.safeParse({ ...valid, category: 'Unlisted' }).success).toBe(false)
    expect(expenseFormSchema.safeParse({ ...valid, transactionDate: '2026-02-30' }).success).toBe(false)
    expect(expenseFormSchema.safeParse({ ...valid, description: ' ' }).success).toBe(false)
  })
})

describe('expense selection and statistics', () => {
  it('filters category, payment, search, and dates together', () => {
    expect(selectExpenses(records, { ...initialExpenseFilters, category: 'Ingredients', search: 'market', paymentMethod: 'Cash', datePreset: 'today' }, today).map((item) => item.id)).toEqual(['b'])
    expect(selectExpenses(records, { ...initialExpenseFilters, search: 'SEPTEMBER' }, today).map((item) => item.id)).toEqual(['c'])
    expect(selectExpenses(records, { ...initialExpenseFilters, datePreset: 'last7' }, today)).toHaveLength(2)
    expect(selectExpenses(records, { ...initialExpenseFilters, datePreset: 'custom', startDate: '2026-09-01', endDate: '2026-09-30' }, today).map((item) => item.id)).toEqual(['c'])
  })
  it('sorts deterministically by date or amount', () => {
    expect(selectExpenses(records, initialExpenseFilters).map((item) => item.id)).toEqual(['a', 'b', 'c'])
    expect(selectExpenses(records, { ...initialExpenseFilters, sort: 'oldest' }).map((item) => item.id)).toEqual(['c', 'a', 'b'])
    expect(selectExpenses(records, { ...initialExpenseFilters, sort: 'highest' }).map((item) => item.id)).toEqual(['c', 'b', 'a'])
    expect(selectExpenses(records, { ...initialExpenseFilters, sort: 'lowest' }).map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })
  it('uses local calendar dates for presets and validates dates', () => {
    expect(localDateString(today)).toBe('2026-10-28')
    expect(dateRangeForPreset('lastMonth', today)).toEqual({ start: '2026-09-01', end: '2026-09-30' })
    expect(isValidDateString('2024-02-29')).toBe(true)
    expect(isValidDateString('2025-02-29')).toBe(false)
    expect(isValidDateString('0099-02-28')).toBe(true)
    expect(isValidDateString('0000-01-01')).toBe(false)
  })
  it('calculates totals and category percentages from integer cents', () => {
    expect(expenseStats(records, today)).toEqual({ totalCents: 13050n, monthCents: 3050n, count: 3, largestCents: 10000n })
    expect(categoryBreakdown(records).find((item) => item.category === 'Ingredients')).toMatchObject({ amountCents: 2550n, percentage: 19.54 })
    expect(expenseStats([], today).totalCents).toBe(0n)
  })
})
