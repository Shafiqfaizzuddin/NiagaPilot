import { localDateString } from './localDates'

export const TREND_PERIODS = [
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
]

export function greetingForLocalTime(now = new Date()) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function dashboardExpenseStats(expenses, now = new Date()) {
  const thisMonth = localDateString(new Date(now.getFullYear(), now.getMonth(), 1)).slice(0, 7)
  const lastMonth = localDateString(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7)
  let totalCents = 0n
  let thisMonthCents = 0n
  let lastMonthCents = 0n
  for (const expense of expenses) {
    const cents = BigInt(expense.amountCents)
    totalCents += cents
    if (expense.transactionDate.startsWith(thisMonth)) thisMonthCents += cents
    if (expense.transactionDate.startsWith(lastMonth)) lastMonthCents += cents
  }
  return { totalCents, thisMonthCents, lastMonthCents, count: expenses.length }
}

export function monthComparison(thisMonthCents, lastMonthCents) {
  const current = BigInt(thisMonthCents)
  const previous = BigInt(lastMonthCents)
  if (previous === 0n) return 'No comparable previous-period expenses'
  const difference = current - previous
  if (difference === 0n) return 'Expenses were unchanged compared to last month.'
  const absolute = difference < 0n ? -difference : difference
  const tenthsOfPercent = (absolute * 1000n + previous / 2n) / previous
  if (tenthsOfPercent === 0n) return `Expenses ${difference > 0n ? 'increased' : 'decreased'} by less than 0.1% compared to last month.`
  const percentage = `${tenthsOfPercent / 10n}.${tenthsOfPercent % 10n}`
  return `Expenses ${difference > 0n ? 'increased' : 'decreased'} by ${percentage}% compared to last month.`
}

export function expenseTrend(expenses, period, now = new Date()) {
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDate = period === 'thisMonth'
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() - (period === 'last30' ? 29 : 6))
  const start = localDateString(startDate)
  const end = localDateString(endDate)
  const totals = new Map()
  for (const expense of expenses) {
    if (expense.transactionDate >= start && expense.transactionDate <= end) {
      totals.set(expense.transactionDate, (totals.get(expense.transactionDate) || 0n) + BigInt(expense.amountCents))
    }
  }
  const days = []
  for (const day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
    const date = localDateString(day)
    const amountCents = totals.get(date) || 0n
    days.push({ date, amountCents, chartValue: Number(amountCents > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : amountCents) })
  }
  return days
}

