import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../config/firebase'

export function observeAuth(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export async function registerUser({ name, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: name })
  return credential.user
}

export async function loginUser({ email, password }) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logoutUser() {
  return signOut(auth)
}
