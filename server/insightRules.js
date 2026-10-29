export const INSIGHT_THRESHOLDS = Object.freeze({
  expenseIncreasePercent: 15,
  revenueDecreasePercent: 15,
  categoryIncreasePercent: 20,
  concentrationPercent: 40,
  surplusDecreasePercent: 15,
  minimumChangeCents: 10_000,
  minimumComparableTransactions: 3,
})

export function detectObservations(analysis, thresholds = INSIGHT_THRESHOLDS) {
  const { metrics, categoryBreakdown } = analysis
  const observations = []
  const currentExpenses = BigInt(metrics.expenses.currentCents)
  const previousExpenses = BigInt(metrics.expenses.previousCents)
  const comparableExpenses = metrics.counts.expensesCurrent >= thresholds.minimumComparableTransactions &&
    metrics.counts.expensesPrevious >= thresholds.minimumComparableTransactions && previousExpenses > 0n
  const salesPeriodData = (metrics.counts.salesCurrent || 0) + (metrics.counts.salesPrevious || 0) >= thresholds.minimumComparableTransactions

  if (comparableExpenses && metrics.expenses.changePercent >= thresholds.expenseIncreasePercent &&
      currentExpenses - previousExpenses >= BigInt(thresholds.minimumChangeCents)) {
    observations.push({
      id: 'expense_increase', type: 'expense_increase', priority: 'medium',
      title: 'Recorded expenses increased', currentAmountCents: String(currentExpenses),
      previousAmountCents: String(previousExpenses), changePercent: metrics.expenses.changePercent,
      supportingRecordCount: metrics.counts.expensesCurrent,
    })
  }

  for (const item of categoryBreakdown) {
    const current = BigInt(item.currentCents), previous = BigInt(item.previousCents)
    if (comparableExpenses && item.currentCount >= 2 && item.previousCount >= 2 &&
        item.changePercent >= thresholds.categoryIncreasePercent &&
        current - previous >= BigInt(thresholds.minimumChangeCents)) {
      observations.push({
        id: `category_increase_${item.category.replace(/[^A-Za-z]/g, '').toLowerCase()}`,
        type: 'category_increase', priority: 'medium', title: `${item.category} spending increased`,
        category: item.category, currentAmountCents: item.currentCents,
        previousAmountCents: item.previousCents, changePercent: item.changePercent,
        supportingRecordCount: item.currentCount,
      })
    }
    if (metrics.counts.expensesCurrent >= thresholds.minimumComparableTransactions &&
        item.sharePercent >= thresholds.concentrationPercent) {
      observations.push({
        id: `concentration_${item.category.replace(/[^A-Za-z]/g, '').toLowerCase()}`,
        type: 'spending_concentration', priority: 'low', title: `${item.category} is a large spending category`,
        category: item.category, currentAmountCents: item.currentCents,
        sharePercent: item.sharePercent, supportingRecordCount: item.currentCount,
      })
    }
  }

  if ((metrics.counts.salesPrevious || 0) >= thresholds.minimumComparableTransactions &&
      metrics.revenue.currentCents !== null && metrics.revenue.previousCents !== null &&
      metrics.revenue.changePercent !== null &&
      metrics.revenue.changePercent <= -thresholds.revenueDecreasePercent) {
    observations.push({
      id: 'revenue_decrease', type: 'revenue_decrease', priority: 'high',
      title: 'Recorded revenue decreased', currentAmountCents: metrics.revenue.currentCents,
      previousAmountCents: metrics.revenue.previousCents, changePercent: metrics.revenue.changePercent,
      supportingRecordCount: metrics.counts.salesCurrent,
    })
  }
  if ((metrics.counts.salesPrevious || 0) >= thresholds.minimumComparableTransactions &&
      metrics.cashBased.surplusCents !== null && metrics.cashBased.previousSurplusCents !== null &&
      metrics.cashBased.changePercent !== null &&
      metrics.cashBased.changePercent <= -thresholds.surplusDecreasePercent) {
    observations.push({
      id: 'surplus_decrease', type: 'declining_cash_surplus', priority: 'high',
      title: 'Estimated cash-based surplus declined',
      currentAmountCents: metrics.cashBased.surplusCents,
      previousAmountCents: metrics.cashBased.previousSurplusCents,
      changePercent: metrics.cashBased.changePercent,
      supportingRecordCount: metrics.counts.salesCurrent,
    })
  }

  const reasons = []
  if (!analysis.dataStatus.salesAvailable) reasons.push('Sales records are unavailable in this application.')
  else if (!salesPeriodData) reasons.push('There are too few sales in the selected and comparable periods for a reliable revenue trend.')
  if (!comparableExpenses) reasons.push('There are too few expenses in both comparable periods for a reliable spending trend.')
  if (reasons.length) observations.push({
    id: 'insufficient_data', type: 'insufficient_data', priority: 'low',
    title: 'More records are needed for a complete assessment',
    explanation: reasons.join(' '), supportingRecordCount: metrics.counts.expensesCurrent,
  })

  const serious = observations.some((item) => item.priority === 'high')
  const attention = observations.some((item) => item.type === 'expense_increase' || item.type === 'category_increase')
  const businessHealth = !analysis.dataStatus.salesAvailable || !salesPeriodData || !comparableExpenses
    ? { state: 'insufficient_data', explanation: reasons.join(' '), informal: true }
    : serious ? { state: 'critical', explanation: 'A significant decline was detected in recorded financial activity.', informal: true }
      : attention ? { state: 'attention', explanation: 'Recorded spending has increased compared with a similar period.', informal: true }
        : { state: 'healthy', explanation: 'No configured spending or revenue warning threshold was reached in the available records.', informal: true }
  return { observations, businessHealth }
}
