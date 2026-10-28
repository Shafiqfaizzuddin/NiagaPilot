import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

function currentUid() {
  const uid = auth?.currentUser?.uid
  if (!uid) throw new Error('Sign in to access your profile.')
  return uid
}

export async function getUserProfile() {
  const snapshot = await getDoc(doc(db, 'users', currentUid()))
  return snapshot.exists() ? snapshot.data() : null
}

export async function createUserProfile(user, fullName) {
  const uid = currentUid()
  if (user.uid !== uid) throw new Error('The account changed. Please sign in again.')
  const profile = {
    uid,
    fullName: fullName.trim(),
    email: user.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(doc(db, 'users', uid), profile)
  return profile
}

export async function ensureUserProfile(user) {
  if (user.uid !== currentUid()) throw new Error('The account changed. Please sign in again.')
  const existing = await getUserProfile()
  if (existing) return existing
  const suggestedName = (user.displayName || user.email?.split('@')[0] || '').trim().slice(0, 100)
  return createUserProfile(user, suggestedName.length >= 2 ? suggestedName : 'Business owner')
}
