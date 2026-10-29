import { createHash } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { ApiError } from './errors.js'

const HISTORY_LIMIT = 10
const idPattern = /^[a-f0-9]{64}$/
const collectionPath = (uid, businessId) => `users/${uid}/businesses/${businessId}/aiBriefings`

export function briefingId(analysis, language, model) {
  return createHash('sha256').update(JSON.stringify([
    analysis.period.key, analysis.dataFingerprint, language, model,
  ])).digest('hex')
}

function serialize(snapshot) {
  if (!snapshot.exists) return null
  const data = snapshot.data()
  return { ...data, id: snapshot.id, generatedAt: data.generatedAt?.toDate?.().toISOString() || null }
}

export async function getSavedBriefing(db, uid, businessId, id) {
  if (!idPattern.test(id)) throw new ApiError(400, 'invalid_briefing', 'Choose a valid briefing.')
  const snapshot = await db.doc(`${collectionPath(uid, businessId)}/${id}`).get()
  return serialize(snapshot)
}

export async function saveBriefing(db, uid, businessId, id, briefing) {
  if (!idPattern.test(id)) throw new ApiError(500, 'invalid_briefing', 'The briefing could not be saved.')
  const reference = db.doc(`${collectionPath(uid, businessId)}/${id}`)
  await reference.create({ ...briefing, businessId, generatedAt: FieldValue.serverTimestamp() })
  return serialize(await reference.get())
}

export async function listBriefings(db, uid, businessId, cursor) {
  const collection = db.collection(collectionPath(uid, businessId))
  let query = collection.orderBy('generatedAt', 'desc').limit(HISTORY_LIMIT + 1)
  if (cursor) {
    if (!idPattern.test(cursor)) throw new ApiError(400, 'invalid_cursor', 'The history cursor is invalid.')
    const anchor = await collection.doc(cursor).get()
    if (!anchor.exists) throw new ApiError(400, 'invalid_cursor', 'The history cursor is no longer available.')
    query = query.startAfter(anchor)
  }
  const snapshot = await query.get()
  const selected = snapshot.docs.slice(0, HISTORY_LIMIT)
  return {
    items: selected.map(serialize),
    nextCursor: snapshot.docs.length > HISTORY_LIMIT ? selected.at(-1).id : null,
  }
}
