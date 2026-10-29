import { z } from 'zod'
import { auth } from '../config/firebase'

const cents = z.string().regex(/^-?\d+$/)
const period = z.object({
  key: z.enum(['last_7_days', 'this_month', 'last_month']),
  label: z.string(), start: z.string(), end: z.string(),
  previousStart: z.string(), previousEnd: z.string(), timezone: z.string(), comparison: z.string(),
})
const metrics = z.object({
  revenue: z.object({ currentCents: cents.nullable(), previousCents: cents.nullable(), changePercent: z.number().nullable() }).passthrough(),
  expenses: z.object({ totalCents: cents, currentCents: cents, previousCents: cents, changePercent: z.number().nullable() }).passthrough(),
  cashBased: z.object({ surplusCents: cents.nullable(), marginPercent: z.number().nullable() }).passthrough(),
  counts: z.object({ expensesCurrent: z.number().int().nonnegative(), expensesPrevious: z.number().int().nonnegative() }).passthrough(),
})
const analysis = z.object({
  period, metrics, categoryBreakdown: z.array(z.object({ category: z.string(), currentCents: cents, sharePercent: z.number() }).passthrough()),
  dataStatus: z.object({ salesAvailable: z.boolean(), explanation: z.string() }),
  dataFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
})
const observation = z.object({ id: z.string(), type: z.string(), priority: z.enum(['low', 'medium', 'high']), title: z.string() }).passthrough()
const health = z.object({ state: z.enum(['healthy', 'attention', 'critical', 'insufficient_data']), explanation: z.string(), informal: z.boolean() })
const citedItem = z.object({ title: z.string(), priority: z.enum(['low', 'medium', 'high']), observationIds: z.array(z.string()) })
const briefing = z.object({
  id: z.string(), businessId: z.string(), generatedAt: z.string().nullable(), period, language: z.enum(['en', 'ms']),
  model: z.string(), provider: z.string(), headline: z.string(), summary: z.string(),
  keyFindings: z.array(citedItem.extend({ explanation: z.string() })),
  recommendations: z.array(citedItem.extend({ description: z.string(), reason: z.string() })),
  businessHealth: health, observations: z.array(observation), financialSnapshot: analysis,
  dataFingerprint: z.string(),
})

async function postAi(path, payload, withRequestId = false) {
  const user = auth?.currentUser
  if (!user) throw new Error('Sign in to use AI insights.')
  let token
  try { token = await user.getIdToken() } catch {
    throw new Error('Could not verify your session. Sign in again and retry.')
  }
  let response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(withRequestId ? { ...payload, requestId: crypto.randomUUID() } : payload),
    })
  } catch {
    throw new Error('Could not connect to the AI service. Check your connection and try again.')
  }
  if ((response.status === 200 || response.status === 404) && response.headers?.get('content-type')?.includes('text/html')) {
    throw new Error('The AI API route was not found. Run npm run dev:full locally or check the Vercel Functions deployment.')
  }
  const result = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired. Sign in again.')
    if (response.status === 404) throw new Error('The AI API route was not found. Run npm run dev:full locally or check the Vercel Functions deployment.')
    if (result?.error?.code === 'server_not_configured' || result?.error?.code === 'server_invalid_config') {
      throw new Error(result.error.message)
    }
    if (result?.error?.code === 'ai_not_configured') throw new Error(result.error.message)
    throw new Error(result?.error?.message || 'The AI service could not complete this request.')
  }
  if (!result || typeof result !== 'object') throw new Error('The AI service returned an invalid response.')
  return result
}

function validated(schema, value) {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error('The AI service returned an invalid response.')
  return result.data
}

export async function testNebiusConnection(businessId) {
  return validated(z.object({
    success: z.literal(true), model: z.string(), response: z.string().min(1).max(500),
    durationMs: z.number().nonnegative(), businessId: z.literal(businessId),
  }), await postAi('/api/ai/test', { businessId }, true))
}

export async function getFinancialAnalysis(businessId, selectedPeriod) {
  return validated(z.object({ businessId: z.literal(businessId), analysis, observations: z.array(observation), businessHealth: health }),
    await postAi('/api/ai/financial-analysis', { businessId, period: selectedPeriod }))
}

export async function generateBusinessBriefing(businessId, selectedPeriod, language) {
  const result = validated(z.object({ briefing, cached: z.boolean() }),
    await postAi('/api/ai/briefing', { businessId, period: selectedPeriod, language }, true))
  if (result.briefing.businessId !== businessId) throw new Error('The AI service returned a briefing for another business.')
  return result
}

export async function getBriefingHistory(businessId, cursor) {
  return validated(z.object({ items: z.array(briefing), nextCursor: z.string().nullable() }),
    await postAi('/api/ai/history', cursor ? { businessId, cursor } : { businessId }))
}

export async function getSavedBusinessBriefing(businessId, briefingId) {
  const result = validated(z.object({ briefing, stale: z.boolean() }),
    await postAi('/api/ai/history', { businessId, briefingId }))
  if (result.briefing.businessId !== businessId) throw new Error('The AI service returned a briefing for another business.')
  return result
}
