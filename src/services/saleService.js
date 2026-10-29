import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { toSaleFields } from '../validations/saleSchema'

function currentUid() {
  const uid = auth?.currentUser?.uid
  if (!uid) throw new Error('Sign in to manage sales.')
  return uid
}

function validId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new Error('Invalid record ID.')
  return value
}

async function ownedBusiness(businessId) {
  const uid = currentUid()
  const snapshot = await getDoc(doc(db, 'users', uid, 'businesses', validId(businessId)))
  if (!snapshot.exists()) throw new Error('This business is not available to your account.')
  if (currentUid() !== uid) throw new Error('Your sign-in changed. Please try again.')
  return uid
}

const saleCollection = (uid) => collection(db, 'users', uid, 'sales')
const saleQuery = (uid, businessId) => query(saleCollection(uid), where('businessId', '==', businessId))
const fromSnapshot = (snapshot) => ({ ...snapshot.data(), id: snapshot.id })

async function ownedSale(businessId, saleId) {
  const uid = await ownedBusiness(businessId)
  const reference = doc(saleCollection(uid), validId(saleId))
  const snapshot = await getDoc(reference)
  if (!snapshot.exists()) return null
  if (snapshot.data().businessId !== businessId) throw new Error('This sale belongs to another business.')
  return { reference, sale: fromSnapshot(snapshot) }
}

export async function createSale(businessId, input) {
  const fields = toSaleFields(input)
  const uid = await ownedBusiness(businessId)
  const reference = await addDoc(saleCollection(uid), {
    businessId, ...fields, source: 'manual',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return reference.id
}

export async function getSales(businessId) {
  const uid = await ownedBusiness(businessId)
  const snapshot = await getDocs(saleQuery(uid, businessId))
  return snapshot.docs.map(fromSnapshot)
}

export function subscribeToSales(businessId, onData, onError) {
  let stopped = false
  let unsubscribe = () => {}
  ownedBusiness(businessId).then((uid) => {
    if (stopped) return
    unsubscribe = onSnapshot(saleQuery(uid, businessId),
      (snapshot) => { if (!stopped) onData(snapshot.docs.map(fromSnapshot)) },
      (error) => { if (!stopped) onError(error) },
    )
  }).catch((error) => { if (!stopped) onError(error) })
  return () => { stopped = true; unsubscribe() }
}

export async function getSaleById(businessId, saleId) {
  return (await ownedSale(businessId, saleId))?.sale || null
}

export async function updateSale(businessId, saleId, input) {
  const fields = toSaleFields(input)
  const record = await ownedSale(businessId, saleId)
  if (!record) throw new Error('Sale not found. Refresh the page and try again.')
  await updateDoc(record.reference, { ...fields, updatedAt: serverTimestamp() })
}

export async function deleteSale(businessId, saleId) {
  const record = await ownedSale(businessId, saleId)
  if (!record) throw new Error('Sale not found. Refresh the page and try again.')
  await deleteDoc(record.reference)
}
