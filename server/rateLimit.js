import { FieldValue } from 'firebase-admin/firestore'
import { ApiError } from './errors.js'

const LIMITS = {
  test: { daily: 3, cooldownMs: 60_000 },
  briefing: { daily: 10, cooldownMs: 120_000 },
}

export async function reserveAiRequest(db, uid, kind, requestId, now = Date.now()) {
  const limit = LIMITS[kind]
  if (!limit || typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(requestId)) {
    throw new ApiError(400, 'invalid_request', 'A valid request ID is required.')
  }
  const reference = db.doc(`users/${uid}/aiRateLimits/${kind}`)
  const day = new Date(now).toISOString().slice(0, 10)
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference)
    const previous = snapshot.exists ? snapshot.data() : {}
    if (previous.requestId === requestId) throw new ApiError(409, 'duplicate_request', 'This AI request was already submitted.')
    const count = previous.day === day ? previous.count || 0 : 0
    if (count >= limit.daily || (previous.nextAllowedAt || 0) > now) {
      throw new ApiError(429, 'rate_limited', 'Please wait before requesting another AI response.')
    }
    transaction.set(reference, {
      day,
      count: count + 1,
      requestId,
      nextAllowedAt: now + limit.cooldownMs,
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
}
