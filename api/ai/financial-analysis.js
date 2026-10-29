import { z } from 'zod'
import { apiHandler } from '../../server/request.js'
import { ApiError } from '../../server/errors.js'
import { readFinancialSummary } from '../../server/finance.js'
import { detectObservations } from '../../server/insightRules.js'

const inputSchema = z.object({
  businessId: z.string(),
  period: z.enum(['last_7_days', 'this_month', 'last_month']),
}).strict()

export default apiHandler(async ({ uid, db, business, body }) => {
  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) throw new ApiError(400, 'invalid_request', 'Choose a valid analysis period.')
  const analysis = await readFinancialSummary(db, uid, business.id, parsed.data.period)
  return { businessId: business.id, analysis, ...detectObservations(analysis) }
})
