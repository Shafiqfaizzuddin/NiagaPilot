import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { businessSchema } from '../validations/businessSchema'

function currentBusinessCollection() {
  const uid = auth?.currentUser?.uid
  if (!uid) throw new Error('Sign in to manage your business.')
  return collection(db, 'users', uid, 'businesses')
}

function businessDocument(businessId) {
  if (typeof businessId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(businessId)) {
    throw new Error('Invalid business ID.')
  }
  return doc(currentBusinessCollection(), businessId)
}

function businessFromSnapshot(snapshot) {
  return { ...snapshot.data(), id: snapshot.id }
}

export async function createBusiness(input) {
  const values = businessSchema.parse(input)
  const reference = await addDoc(currentBusinessCollection(), {
    ...values,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const snapshot = await getDoc(reference)
  return businessFromSnapshot(snapshot)
}

export async function getBusinesses() {
  const snapshot = await getDocs(currentBusinessCollection())
  return snapshot.docs.map(businessFromSnapshot).sort((a, b) => {
    const dateDifference = (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)
    return dateDifference || a.id.localeCompare(b.id)
  })
}

export async function getBusinessById(businessId) {
  const snapshot = await getDoc(businessDocument(businessId))
  return snapshot.exists() ? businessFromSnapshot(snapshot) : null
}

export async function updateBusiness(businessId, input) {
  const values = businessSchema.parse(input)
  await updateDoc(businessDocument(businessId), {
    name: values.name,
    category: values.category,
    description: values.description,
    location: values.location,
    updatedAt: serverTimestamp(),
  })
  return getBusinessById(businessId)
}
