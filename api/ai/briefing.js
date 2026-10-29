import { z } from 'zod'
import { apiHandler } from '../../server/request.js'
import { ApiError } from '../../server/errors.js'
import { readFinancialSummary } from '../../server/finance.js'
import { detectObservations } from '../../server/insightRules.js'
import { briefingMessages } from '../../server/aiPrompt.js'
import { parseBriefingOutput } from '../../server/aiOutput.js'
import { briefingId, getSavedBriefing, saveBriefing } from '../../server/briefingHistory.js'
import { reserveAiRequest } from '../../server/rateLimit.js'
import { callNemotron, nebiusModel } from '../../server/nebius.js'

const inputSchema = z.object({
  businessId: z.string(),
  requestId: z.string(),
  period: z.enum(['last_7_days', 'this_month', 'last_month']),
  language: z.enum(['en', 'ms']),
}).strict()

export default apiHandler(async ({ uid, db, business, body }) => {
  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) throw new ApiError(400, 'invalid_request', 'Choose a valid period and language.')
  const { period, language, requestId } = parsed.data
  const analysis = await readFinancialSummary(db, uid, business.id, period)
  const { observations, businessHealth } = detectObservations(analysis)
  const model = nebiusModel()
  const id = briefingId(analysis, language, model)
  const cached = await getSavedBriefing(db, uid, business.id, id)
  if (cached) return { briefing: cached, cached: true }

  await reserveAiRequest(db, uid, 'briefing', requestId)
  const raw = await callNemotron(briefingMessages(analysis, observations, language), 1100)
  const narrative = parseBriefingOutput(raw, observations)
  const document = {
    period: analysis.period,
    language,
    model,
    provider: 'Nebius Token Factory',
    ...narrative,
    businessHealth,
    observations,
    financialSnapshot: analysis,
    dataFingerprint: analysis.dataFingerprint,
  }
  try {
    return { briefing: await saveBriefing(db, uid, business.id, id, document), cached: false }
  } catch (error) {
    if (error.code === 6 || error.code === 'already-exists') {
      const existing = await getSavedBriefing(db, uid, business.id, id)
      if (existing) return { briefing: existing, cached: true }
    }
    throw error
  }
})
