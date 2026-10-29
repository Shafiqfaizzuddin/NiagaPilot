import { describe, expect, it, vi } from 'vitest'
import { briefingId, getSavedBriefing, listBriefings, saveBriefing } from '../../server/briefingHistory.js'

const analysis = { period: { key: 'this_month' }, dataFingerprint: 'f'.repeat(64) }
const sample = { exists: true, id: 'a'.repeat(64), data: () => ({
  businessId: 'shop', headline: 'Review spending', generatedAt: { toDate: () => new Date('2026-10-28T00:00:00Z') },
}) }

describe('business-scoped briefing history', () => {
  it('keys cached briefings to data, language, period, and model', () => {
    expect(briefingId(analysis, 'en', 'nvidia/model')).not.toBe(briefingId(analysis, 'ms', 'nvidia/model'))
    expect(briefingId(analysis, 'en', 'nvidia/model')).not.toBe(briefingId(analysis, 'en', 'nvidia/other'))
    expect(briefingId(analysis, 'en', 'nvidia/model')).not.toBe(briefingId({ ...analysis, dataFingerprint: 'e'.repeat(64) }, 'en', 'nvidia/model'))
  })

  it('writes only inside the verified user business path and serializes timestamps', async () => {
    const reference = { create: vi.fn(), get: vi.fn().mockResolvedValue(sample) }
    const db = { doc: vi.fn().mockReturnValue(reference) }
    const id = 'a'.repeat(64)
    const saved = await saveBriefing(db, 'owner', 'shop', id, { headline: 'Review spending' })
    expect(db.doc).toHaveBeenCalledWith(`users/owner/businesses/shop/aiBriefings/${id}`)
    expect(reference.create).toHaveBeenCalledWith(expect.objectContaining({ businessId: 'shop', headline: 'Review spending', generatedAt: expect.anything() }))
    expect(saved.generatedAt).toBe('2026-10-28T00:00:00.000Z')
    expect(await getSavedBriefing(db, 'owner', 'shop', id)).toMatchObject({ id, businessId: 'shop' })
  })

  it('limits history and returns a cursor for another page', async () => {
    const docs = Array.from({ length: 11 }, (_, index) => ({ ...sample, id: index.toString(16).padStart(64, '0') }))
    const query = { limit: vi.fn().mockReturnThis(), get: vi.fn().mockResolvedValue({ docs }) }
    const collection = { orderBy: vi.fn().mockReturnValue(query) }
    const db = { collection: vi.fn().mockReturnValue(collection) }
    const result = await listBriefings(db, 'owner', 'shop')
    expect(db.collection).toHaveBeenCalledWith('users/owner/businesses/shop/aiBriefings')
    expect(result.items).toHaveLength(10)
    expect(result.nextCursor).toBe(docs[9].id)
  })
})
