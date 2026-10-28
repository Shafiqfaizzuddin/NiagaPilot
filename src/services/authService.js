import {
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../config/firebase'

export function observeAuth(callback, onError) {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback, onError)
}

export async function registerUser({ email, password }) {
  await setPersistence(auth, browserLocalPersistence)
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function loginUser({ email, password }) {
  await setPersistence(auth, browserLocalPersistence)
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function logoutUser() {
  return signOut(auth)
}
