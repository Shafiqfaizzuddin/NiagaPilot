import { dateRangeForPreset, localDateString } from './localDates'

export const initialExpenseFilters = { search: '', category: '', paymentMethod: '', datePreset: 'all', startDate: '', endDate: '', sort: 'newest' }

export function selectExpenses(expenses, filters, today = new Date()) {
  const query = filters.search.trim().toLocaleLowerCase()
  const range = filters.datePreset === 'custom'
    ? { start: filters.startDate, end: filters.endDate }
    : dateRangeForPreset(filters.datePreset, today)
  return expenses.filter((expense) => {
    if (filters.category && expense.category !== filters.category) return false
    if (filters.paymentMethod && expense.paymentMethod !== filters.paymentMethod) return false
    if (range.start && expense.transactionDate < range.start) return false
    if (range.end && expense.transactionDate > range.end) return false
    return !query || [expense.description, expense.merchant, expense.notes].some((value) => value?.toLocaleLowerCase().includes(query))
  }).sort((a, b) => {
    if (filters.sort === 'highest' || filters.sort === 'lowest') {
      const amountDifference = a.amountCents - b.amountCents
      if (amountDifference) return filters.sort === 'highest' ? -amountDifference : amountDifference
    }
    const dateDifference = a.transactionDate.localeCompare(b.transactionDate)
    if (dateDifference) return filters.sort === 'oldest' ? dateDifference : -dateDifference
    return a.id.localeCompare(b.id)
  })
}

export function expenseStats(expenses, today = new Date()) {
  const month = localDateString(new Date(today.getFullYear(), today.getMonth(), 1)).slice(0, 7)
  return {
    totalCents: expenses.reduce((sum, expense) => sum + BigInt(expense.amountCents), 0n),
    monthCents: expenses.filter((expense) => expense.transactionDate.startsWith(month)).reduce((sum, expense) => sum + BigInt(expense.amountCents), 0n),
    count: expenses.length,
    largestCents: expenses.reduce((largest, expense) => BigInt(expense.amountCents) > largest ? BigInt(expense.amountCents) : largest, 0n),
  }
}

export function categoryBreakdown(expenses) {
  const totals = new Map()
  for (const expense of expenses) totals.set(expense.category, (totals.get(expense.category) || 0n) + BigInt(expense.amountCents))
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0n)
  return [...totals].map(([category, amountCents]) => ({
    category,
    amountCents,
    percentage: total ? Number(amountCents * 10000n / total) / 100 : 0,
    chartValue: total ? Number(amountCents * 1_000_000n / total) : 0,
  })).sort((a, b) => b.amountCents > a.amountCents ? 1 : b.amountCents < a.amountCents ? -1 : a.category.localeCompare(b.category))
}
