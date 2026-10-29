import { z } from 'zod'
import { apiHandler } from '../../server/request.js'
import { reserveAiRequest } from '../../server/rateLimit.js'
import { callNemotron, nebiusModel } from '../../server/nebius.js'
import { ApiError } from '../../server/errors.js'

const inputSchema = z.object({
  businessId: z.string(),
  requestId: z.string(),
}).strict()

export default apiHandler(async ({ uid, db, business, body }) => {
  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) throw new ApiError(400, 'invalid_request', 'A business and request ID are required.')
  await reserveAiRequest(db, uid, 'test', parsed.data.requestId)
  const started = Date.now()
  const response = await callNemotron([
    { role: 'system', content: 'You are NiagaPilot AI, an assistant helping Malaysian microbusiness owners understand their business finances. Introduce yourself briefly. Do not mention figures or credentials.' },
    { role: 'user', content: 'Introduce yourself briefly.' },
  ], 100)
  if (response.length > 500) throw new ApiError(502, 'invalid_ai_response', 'The AI provider returned an invalid response.')
  return { success: true, model: nebiusModel(), response, durationMs: Date.now() - started, businessId: business.id }
})
