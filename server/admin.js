import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { ApiError } from './errors.js'

const APP_NAME = 'niagapilot-server'

export function getAdminServices() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env
  if (!FIREBASE_PROJECT_ID?.trim() || !FIREBASE_CLIENT_EMAIL?.trim() || !FIREBASE_PRIVATE_KEY?.trim()) {
    throw new ApiError(503, 'server_not_configured', 'Firebase Admin is not configured for this environment. Add the server-only Firebase settings and restart the server.')
  }
  let app = getApps().find((item) => item.name === APP_NAME)
  if (!app) {
    try {
      app = initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: FIREBASE_PROJECT_ID,
      }, APP_NAME)
    } catch {
      throw new ApiError(503, 'server_invalid_config', 'Firebase Admin credentials are invalid for this environment.')
    }
  }
  return { auth: getAuth(app), db: getFirestore(app) }
}
