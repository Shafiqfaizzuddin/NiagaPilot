import { localDateString } from './localDates'

export function saleStats(sales, now = new Date()) {
  const month = localDateString(new Date(now.getFullYear(), now.getMonth(), 1)).slice(0, 7)
  const previous = localDateString(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7)
  let totalCents = 0n, monthCents = 0n, previousMonthCents = 0n
  for (const sale of sales) {
    const cents = BigInt(sale.amountCents)
    totalCents += cents
    if (sale.transactionDate.startsWith(month)) monthCents += cents
    if (sale.transactionDate.startsWith(previous)) previousMonthCents += cents
  }
  return { totalCents, monthCents, previousMonthCents, count: sales.length }
}

export function selectSales(sales, { search = '', paymentMethod = '', sort = 'newest' } = {}) {
  const term = search.trim().toLocaleLowerCase()
  const filtered = sales.filter((sale) =>
    (!paymentMethod || sale.paymentMethod === paymentMethod) &&
    (!term || [sale.description, sale.customer, sale.notes].some((value) => value?.toLocaleLowerCase().includes(term))),
  )
  return filtered.sort((a, b) => {
    if (sort === 'highest' || sort === 'lowest') {
      const difference = BigInt(a.amountCents) - BigInt(b.amountCents)
      if (difference !== 0n) return sort === 'highest' ? (difference > 0n ? -1 : 1) : (difference > 0n ? 1 : -1)
    }
    const date = a.transactionDate.localeCompare(b.transactionDate)
    if (date) return sort === 'oldest' ? date : -date
    return a.id.localeCompare(b.id)
  })
}
