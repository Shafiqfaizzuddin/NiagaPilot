import { z } from 'zod'
import { apiHandler } from '../../server/request.js'
import { ApiError } from '../../server/errors.js'
import { getSavedBriefing, listBriefings } from '../../server/briefingHistory.js'
import { readFinancialSummary } from '../../server/finance.js'

const inputSchema = z.object({
  businessId: z.string(),
  briefingId: z.string().optional(),
  cursor: z.string().optional(),
}).strict()

export default apiHandler(async ({ uid, db, business, body }) => {
  const parsed = inputSchema.safeParse(body)
  if (!parsed.success || (parsed.data.briefingId && parsed.data.cursor)) {
    throw new ApiError(400, 'invalid_request', 'Choose a valid history request.')
  }
  if (parsed.data.briefingId) {
    const briefing = await getSavedBriefing(db, uid, business.id, parsed.data.briefingId)
    if (!briefing) throw new ApiError(404, 'briefing_not_found', 'This briefing is not available.')
    const current = await readFinancialSummary(db, uid, business.id, briefing.period.key)
    return { briefing, stale: current.dataFingerprint !== briefing.dataFingerprint }
  }
  return listBriefings(db, uid, business.id, parsed.data.cursor)
})
