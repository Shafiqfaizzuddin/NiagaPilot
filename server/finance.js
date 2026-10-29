import { createHash } from 'node:crypto'
import { ApiError } from './errors.js'

const TIMEZONE = 'Asia/Kuala_Lumpur'
const MAX_RECORDS = 2000
const CATEGORIES = new Set(['Ingredients', 'Packaging', 'Utilities', 'Rent', 'Transportation', 'Equipment', 'Marketing', 'Other'])
const dateText = (date) => date.toISOString().slice(0, 10)
const day = (year, month, date) => new Date(Date.UTC(year, month, date))
const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000)

function malaysiaToday(now) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const value = (type) => Number(parts.find((part) => part.type === type)?.value)
  return day(value('year'), value('month') - 1, value('day'))
}

export function periodRange(period, now = new Date()) {
  const today = malaysiaToday(now)
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth()
  const date = today.getUTCDate()
  let start, end, previousStart, previousEnd, label, comparison
  if (period === 'last_7_days') {
    start = addDays(today, -6); end = today
    previousEnd = addDays(start, -1); previousStart = addDays(previousEnd, -6)
    label = 'Last 7 days'; comparison = 'Previous rolling 7 days'
  } else if (period === 'this_month') {
    start = day(year, month, 1); end = today
    previousStart = day(year, month - 1, 1)
    previousEnd = day(year, month - 1, Math.min(date, day(year, month, 0).getUTCDate()))
    label = 'This month'; comparison = 'Same calendar days of previous month, capped at month end'
  } else if (period === 'last_month') {
    start = day(year, month - 1, 1); end = day(year, month, 0)
    previousStart = day(year, month - 2, 1); previousEnd = day(year, month - 1, 0)
    label = 'Last month'; comparison = 'Previous completed calendar month'
  } else throw new ApiError(400, 'invalid_period', 'Choose a supported analysis period.')
  return { key: period, label, timezone: TIMEZONE, comparison, start: dateText(start), end: dateText(end), previousStart: dateText(previousStart), previousEnd: dateText(previousEnd) }
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && dateText(parsed) === value
}

function validateExpense(record, businessId) {
  if (record.businessId !== businessId || !Number.isSafeInteger(record.amountCents) ||
      record.amountCents <= 0 || record.amountCents > 99_999_999_999 ||
      !validDate(record.transactionDate) || !CATEGORIES.has(record.category)) {
    throw new ApiError(422, 'invalid_financial_data', 'A recorded expense contains invalid financial data.')
  }
}

function validateSale(record, businessId) {
  if (record.businessId !== businessId || !Number.isSafeInteger(record.amountCents) ||
      record.amountCents <= 0 || record.amountCents > 99_999_999_999 ||
      !validDate(record.transactionDate) || typeof record.description !== 'string' ||
      !record.description.trim() || record.description.length > 120 ||
      typeof record.customer !== 'string' || record.customer.length > 120 ||
      typeof record.notes !== 'string' || record.notes.length > 500 ||
      !['', 'Cash', 'Bank Transfer', 'E-Wallet', 'Debit/Credit Card', 'Other'].includes(record.paymentMethod) ||
      record.source !== 'manual') {
    throw new ApiError(422, 'invalid_financial_data', 'A recorded sale contains invalid financial data.')
  }
}

const sum = (records) => records.reduce((total, record) => total + BigInt(record.amountCents), 0n)
const change = (current, previous) => previous === 0n ? null : Math.round(Number(current - previous) / Number(previous) * 10000) / 100
function categoryTotals(records) {
  const result = new Map()
  for (const record of records) {
    const prior = result.get(record.category) || { cents: 0n, count: 0 }
    result.set(record.category, { cents: prior.cents + BigInt(record.amountCents), count: prior.count + 1 })
  }
  return result
}

function fingerprint(expenses, sales, range) {
  const hash = createHash('sha256')
  hash.update(JSON.stringify(range))
  for (const [kind, records] of [['expense', expenses], ['sale', sales]]) {
    for (const record of [...records].sort((a, b) => a.id.localeCompare(b.id))) {
      hash.update(JSON.stringify([kind, record.id, record.amountCents, record.category || null, record.transactionDate, record.updatedAt?.toMillis?.() || null]))
    }
  }
  return hash.digest('hex')
}

export async function readFinancialSummary(db, uid, businessId, period, now = new Date()) {
  const range = periodRange(period, now)
  const [expenseSnapshot, saleSnapshot] = await Promise.all([
    db.collection(`users/${uid}/expenses`).where('businessId', '==', businessId).limit(MAX_RECORDS + 1).get(),
    db.collection(`users/${uid}/sales`).where('businessId', '==', businessId).limit(MAX_RECORDS + 1).get(),
  ])
  if (expenseSnapshot.size > MAX_RECORDS || saleSnapshot.size > MAX_RECORDS) {
    throw new ApiError(413, 'too_many_records', 'This business has too many transactions for an AI briefing.')
  }
  const records = expenseSnapshot.docs.map((document) => {
    const data = document.data()
    validateExpense(data, businessId)
    return { ...data, id: document.id }
  })
  const sales = saleSnapshot.docs.map((document) => {
    const data = document.data()
    validateSale(data, businessId)
    return { ...data, id: document.id }
  })
  const within = (record, start, end) => record.transactionDate >= start && record.transactionDate <= end
  const current = records.filter((record) => within(record, range.start, range.end))
  const previous = records.filter((record) => within(record, range.previousStart, range.previousEnd))
  const currentSales = sales.filter((record) => within(record, range.start, range.end))
  const previousSales = sales.filter((record) => within(record, range.previousStart, range.previousEnd))
  const currentCents = sum(current), previousCents = sum(previous)
  const salesAvailable = sales.length > 0
  const revenueCurrent = sum(currentSales), revenuePrevious = sum(previousSales)
  const surplus = revenueCurrent - currentCents, previousSurplus = revenuePrevious - previousCents
  const currentCategories = categoryTotals(current), previousCategories = categoryTotals(previous)
  const categoryBreakdown = [...new Set([...currentCategories.keys(), ...previousCategories.keys()])].map((category) => {
    const nowValue = currentCategories.get(category) || { cents: 0n, count: 0 }
    const beforeValue = previousCategories.get(category) || { cents: 0n, count: 0 }
    return {
      category, currentCents: String(nowValue.cents), previousCents: String(beforeValue.cents),
      currentCount: nowValue.count, previousCount: beforeValue.count,
      sharePercent: currentCents ? Math.round(Number(nowValue.cents) / Number(currentCents) * 10000) / 100 : 0,
      changePercent: change(nowValue.cents, beforeValue.cents),
    }
  }).sort((a, b) => BigInt(b.currentCents) > BigInt(a.currentCents) ? 1 : BigInt(b.currentCents) < BigInt(a.currentCents) ? -1 : a.category.localeCompare(b.category))
  const today = dateText(malaysiaToday(now))
  const last7 = dateText(addDays(malaysiaToday(now), -6))
  const thisMonth = today.slice(0, 7)
  const previousMonth = dateText(day(malaysiaToday(now).getUTCFullYear(), malaysiaToday(now).getUTCMonth() - 1, 1)).slice(0, 7)
  return {
    period: range,
    metrics: {
      revenue: {
        totalCents: salesAvailable ? String(sum(sales)) : null,
        todayCents: salesAvailable ? String(sum(sales.filter((record) => record.transactionDate === today))) : null,
        last7DaysCents: salesAvailable ? String(sum(sales.filter((record) => within(record, last7, today)))) : null,
        thisMonthCents: salesAvailable ? String(sum(sales.filter((record) => record.transactionDate.startsWith(thisMonth)))) : null,
        previousMonthCents: salesAvailable ? String(sum(sales.filter((record) => record.transactionDate.startsWith(previousMonth)))) : null,
        currentCents: salesAvailable ? String(revenueCurrent) : null,
        previousCents: salesAvailable ? String(revenuePrevious) : null,
        changePercent: salesAvailable ? change(revenueCurrent, revenuePrevious) : null,
      },
      expenses: {
        totalCents: String(sum(records)), currentCents: String(currentCents), previousCents: String(previousCents),
        todayCents: String(sum(records.filter((record) => record.transactionDate === today))),
        last7DaysCents: String(sum(records.filter((record) => within(record, last7, today)))),
        thisMonthCents: String(sum(records.filter((record) => record.transactionDate.startsWith(thisMonth)))),
        previousMonthCents: String(sum(records.filter((record) => record.transactionDate.startsWith(previousMonth)))),
        changePercent: change(currentCents, previousCents),
      },
      cashBased: {
        surplusCents: salesAvailable ? String(surplus) : null,
        previousSurplusCents: salesAvailable ? String(previousSurplus) : null,
        marginPercent: salesAvailable && revenueCurrent > 0n ? Math.round(Number(surplus) / Number(revenueCurrent) * 10000) / 100 : null,
        changePercent: salesAvailable && previousSurplus > 0n ? change(surplus, previousSurplus) : null,
      },
      counts: { expensesCurrent: current.length, expensesPrevious: previous.length, expensesAll: records.length,
        salesCurrent: currentSales.length, salesPrevious: previousSales.length, salesAll: sales.length },
    },
    categoryBreakdown,
    dataStatus: { salesAvailable, explanation: salesAvailable
      ? 'Figures use recorded sales and expenses only. Estimated cash-based surplus is not accounting net profit.'
      : 'No sales have been recorded for this business; revenue and cash-based surplus are unavailable.' },
    dataFingerprint: fingerprint(records, sales, range),
  }
}
