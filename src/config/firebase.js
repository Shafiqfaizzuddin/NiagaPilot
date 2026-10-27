import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)
export const firebaseApp = isFirebaseConfigured
  ? getApps().length ? getApp() : initializeApp(firebaseConfig)
  : null
export const auth = firebaseApp ? getAuth(firebaseApp) : null

export async function getDb() {
  if (!firebaseApp) return null
  const { getFirestore } = await import('firebase/firestore')
  return getFirestore(firebaseApp)
}
