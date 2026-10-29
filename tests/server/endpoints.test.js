import { beforeEach, describe, expect, it, vi } from 'vitest'
import testHandler from '../../api/ai/test.js'
import briefingHandler from '../../api/ai/briefing.js'
import analysisHandler from '../../api/ai/financial-analysis.js'
import historyHandler from '../../api/ai/history.js'
import { getAdminServices } from '../../server/admin.js'
import { reserveAiRequest } from '../../server/rateLimit.js'
import { readFinancialSummary } from '../../server/finance.js'
import { detectObservations } from '../../server/insightRules.js'
import { callNemotron } from '../../server/nebius.js'
import { briefingId, getSavedBriefing, listBriefings, saveBriefing } from '../../server/briefingHistory.js'

vi.mock('../../server/admin.js', () => ({ getAdminServices: vi.fn() }))
vi.mock('../../server/rateLimit.js', () => ({ reserveAiRequest: vi.fn() }))
vi.mock('../../server/finance.js', () => ({ readFinancialSummary: vi.fn() }))
vi.mock('../../server/insightRules.js', () => ({ detectObservations: vi.fn() }))
vi.mock('../../server/nebius.js', () => ({ callNemotron: vi.fn(), nebiusModel: () => 'nvidia/nemotron-3-super-120b-a12b' }))
vi.mock('../../server/briefingHistory.js', () => ({
  briefingId: vi.fn(), getSavedBriefing: vi.fn(), listBriefings: vi.fn(), saveBriefing: vi.fn(),
}))

const analysis = {
  period: { key: 'this_month', label: 'This month', start: '2026-10-01', end: '2026-10-28' },
  metrics: {
    expenses: { currentCents: '2550', previousCents: '0', changePercent: null },
    revenue: { currentCents: null }, cashBased: { surplusCents: null },
    counts: { expensesCurrent: 1, expensesPrevious: 0 },
  },
  categoryBreakdown: [], dataStatus: { salesAvailable: false },
  dataFingerprint: 'f'.repeat(64),
}
const observation = { id: 'insufficient_data', type: 'insufficient_data', priority: 'low', title: 'More records are needed' }
const modelOutput = JSON.stringify({
  headline: 'Review your spending', summary: 'There is limited spending history for this period.',
  keyFindings: [],
  recommendations: [{
    title: 'Record more transactions', description: 'Keep recording business expenses consistently.',
    reason: 'More records will make comparisons more useful.', priority: 'low',
    observationIds: ['insufficient_data'],
  }],
})
const base = { businessId: 'shop', requestId: 'request-123456' }
const request = (body, authorization = 'Bearer valid-token') => ({ method: 'POST', headers: { authorization }, body })
const response = () => ({ setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getAdminServices).mockReturnValue({
    auth: { verifyIdToken: vi.fn().mockResolvedValue({ uid: 'owner' }) },
    db: { doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ exists: true, id: 'shop', data: () => ({ name: 'Shop' }) }) }) },
  })
  vi.mocked(readFinancialSummary).mockResolvedValue(analysis)
  vi.mocked(detectObservations).mockReturnValue({ observations: [observation], businessHealth: { state: 'insufficient_data', explanation: 'Sales unavailable', informal: true } })
  vi.mocked(briefingId).mockReturnValue('a'.repeat(64))
  vi.mocked(getSavedBriefing).mockResolvedValue(null)
  vi.mocked(saveBriefing).mockResolvedValue({ id: 'a'.repeat(64), businessId: 'shop', headline: 'Review your spending' })
  vi.mocked(listBriefings).mockResolvedValue({ items: [], nextCursor: null })
})

describe('protected AI endpoints', () => {
  it('returns a short authenticated connection test', async () => {
    vi.mocked(callNemotron).mockResolvedValue('Hello from NiagaPilot.')
    const res = response()
    await testHandler(request(base), res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true, response: 'Hello from NiagaPilot.', model: 'nvidia/nemotron-3-super-120b-a12b',
    }))
    expect(reserveAiRequest).toHaveBeenCalledWith(expect.anything(), 'owner', 'test', base.requestId)
  })

  it('rejects absent and invalid Firebase tokens before paid calls', async () => {
    const missing = response()
    await testHandler(request(base, ''), missing)
    expect(missing.status).toHaveBeenCalledWith(401)
    vi.mocked(getAdminServices).mockReturnValue({ auth: { verifyIdToken: vi.fn().mockRejectedValue(new Error('expired')) }, db: {} })
    const invalid = response()
    await briefingHandler(request({ ...base, period: 'this_month', language: 'en' }), invalid)
    expect(invalid.status).toHaveBeenCalledWith(401)
    expect(callNemotron).not.toHaveBeenCalled()
  })

  it('returns server-calculated analysis without invoking AI', async () => {
    const res = response()
    await analysisHandler(request({ businessId: 'shop', period: 'this_month' }), res)
    expect(readFinancialSummary).toHaveBeenCalledWith(expect.anything(), 'owner', 'shop', 'this_month')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(callNemotron).not.toHaveBeenCalled()
  })

  it('saves a validated evidence-backed briefing and reuses an identical cached one', async () => {
    vi.mocked(callNemotron).mockResolvedValue(modelOutput)
    const body = { ...base, period: 'this_month', language: 'ms' }
    const first = response()
    await briefingHandler(request(body), first)
    expect(first.status).toHaveBeenCalledWith(200)
    expect(saveBriefing).toHaveBeenCalledWith(expect.anything(), 'owner', 'shop', 'a'.repeat(64), expect.objectContaining({
      language: 'ms', provider: 'Nebius Token Factory',
    }))
    vi.mocked(getSavedBriefing).mockResolvedValue({ id: 'a'.repeat(64), businessId: 'shop' })
    const second = response()
    await briefingHandler(request(body), second)
    expect(second.json).toHaveBeenCalledWith({ briefing: expect.anything(), cached: true })
    expect(callNemotron).toHaveBeenCalledTimes(1)
  })

  it('rejects unsupported model evidence and does not save malformed output', async () => {
    vi.mocked(callNemotron).mockResolvedValue(modelOutput.replace('insufficient_data', 'invented'))
    const res = response()
    await briefingHandler(request({ ...base, period: 'this_month', language: 'en' }), res)
    expect(res.status).toHaveBeenCalledWith(502)
    expect(saveBriefing).not.toHaveBeenCalled()
  })

  it('rejects requests for other users businesses', async () => {
    const services = vi.mocked(getAdminServices)()
    services.db.doc().get.mockResolvedValue({ exists: false })
    vi.mocked(getAdminServices).mockReturnValue(services)
    const res = response()
    await briefingHandler(request({ ...base, period: 'this_month', language: 'en' }), res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(readFinancialSummary).not.toHaveBeenCalled()
  })

  it('rejects invalid periods and client-supplied financial totals', async () => {
    const badPeriod = response()
    await analysisHandler(request({ businessId: 'shop', period: 'all_time' }), badPeriod)
    expect(badPeriod.status).toHaveBeenCalledWith(400)
    const forged = response()
    await briefingHandler(request({ ...base, period: 'this_month', language: 'en', revenueCents: 999999 }), forged)
    expect(forged.status).toHaveBeenCalledWith(400)
    expect(callNemotron).not.toHaveBeenCalled()
  })

  it('lists and reads history only after business ownership verification', async () => {
    const list = response()
    await historyHandler(request({ businessId: 'shop' }), list)
    expect(list.status).toHaveBeenCalledWith(200)
    expect(listBriefings).toHaveBeenCalledWith(expect.anything(), 'owner', 'shop', undefined)
    vi.mocked(getSavedBriefing).mockResolvedValue({ id: 'a'.repeat(64), period: { key: 'this_month' }, dataFingerprint: analysis.dataFingerprint })
    const single = response()
    await historyHandler(request({ businessId: 'shop', briefingId: 'a'.repeat(64) }), single)
    expect(single.json).toHaveBeenCalledWith(expect.objectContaining({ stale: false }))
  })
})
