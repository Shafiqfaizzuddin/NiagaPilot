import { z } from 'zod'
import { getAdminServices } from './admin.js'
import { ApiError, sendError } from './errors.js'

const businessIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/)
const MAX_BODY_BYTES = 8192

export function parsePostBody(request) {
  if (request.method !== 'POST') throw new ApiError(405, 'method_not_allowed', 'Use POST for this endpoint.')
  const headerLength = Number(request.headers['content-length'])
  if (Number.isFinite(headerLength) && headerLength > MAX_BODY_BYTES) {
    throw new ApiError(413, 'payload_too_large', 'The request is too large.')
  }
  const body = request.body
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) {
    throw new ApiError(400, 'invalid_request', 'Send a small JSON object.')
  }
  return body
}

export async function authenticate(request) {
  const match = /^Bearer\s+([^\s]+)$/i.exec(request.headers.authorization || '')
  if (!match) throw new ApiError(401, 'unauthenticated', 'Sign in to use this feature.')
  const services = getAdminServices()
  try {
    const decoded = await services.auth.verifyIdToken(match[1], true)
    if (!decoded.uid) throw new Error('Missing UID')
    return { uid: decoded.uid, db: services.db }
  } catch {
    throw new ApiError(401, 'invalid_token', 'Your session has expired. Please sign in again.')
  }
}

export async function ownedBusiness(db, uid, candidateId) {
  const businessId = businessIdSchema.safeParse(candidateId)
  if (!businessId.success) throw new ApiError(400, 'invalid_business', 'Choose a valid business.')
  const snapshot = await db.doc(`users/${uid}/businesses/${businessId.data}`).get()
  if (!snapshot.exists) throw new ApiError(403, 'business_forbidden', 'This business is not available to your account.')
  return { ...snapshot.data(), id: snapshot.id }
}

export function apiHandler(action) {
  return async (request, response) => {
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    try {
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST')
        throw new ApiError(405, 'method_not_allowed', 'Use POST for this endpoint.')
      }
      const session = await authenticate(request)
      const body = parsePostBody(request)
      const business = await ownedBusiness(session.db, session.uid, body.businessId)
      const result = await action({ ...session, business, body })
      return response.status(200).json(result)
    } catch (error) {
      return sendError(response, error)
    }
  }
}
