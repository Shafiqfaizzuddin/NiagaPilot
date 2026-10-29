import { describe, expect, it, vi } from 'vitest'
import { reserveAiRequest } from '../../server/rateLimit.js'

function database(previous = null) {
  const snapshot = { exists: Boolean(previous), data: () => previous }
  const transaction = { get: vi.fn().mockResolvedValue(snapshot), set: vi.fn() }
  const db = {
    doc: vi.fn().mockReturnValue({}),
    runTransaction: vi.fn(async (action) => action(transaction)),
  }
  return { db, transaction }
}

describe('per-user AI request limits', () => {
  it('reserves a request under the authenticated user path', async () => {
    const { db, transaction } = database()
    await reserveAiRequest(db, 'owner', 'briefing', 'request-123456', Date.parse('2026-10-28T00:00:00Z'))
    expect(db.doc).toHaveBeenCalledWith('users/owner/aiRateLimits/briefing')
    expect(transaction.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ count: 1, requestId: 'request-123456' }))
  })

  it('rejects duplicates, cooldowns, and daily exhaustion', async () => {
    const now = Date.parse('2026-10-28T00:00:00Z')
    await expect(reserveAiRequest(database({ day: '2026-10-28', requestId: 'request-123456' }).db, 'owner', 'test', 'request-123456', now)).rejects.toMatchObject({ code: 'duplicate_request' })
    await expect(reserveAiRequest(database({ day: '2026-10-28', count: 1, nextAllowedAt: now + 1000 }).db, 'owner', 'test', 'new-request-123', now)).rejects.toMatchObject({ code: 'rate_limited' })
    await expect(reserveAiRequest(database({ day: '2026-10-28', count: 3 }).db, 'owner', 'test', 'new-request-123', now)).rejects.toMatchObject({ code: 'rate_limited' })
  })
})
