import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { toExpenseFields } from '../validations/expenseSchema'

function currentUid() {
  const uid = auth?.currentUser?.uid
  if (!uid) throw new Error('Sign in to manage expenses.')
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

function expensesCollection(uid) {
  return collection(db, 'users', uid, 'expenses')
}

function expenseQuery(uid, businessId) {
  return query(expensesCollection(uid), where('businessId', '==', businessId))
}

function fromSnapshot(snapshot) {
  return { ...snapshot.data(), id: snapshot.id }
}

async function ownedExpense(businessId, expenseId) {
  const uid = await ownedBusiness(businessId)
  const reference = doc(expensesCollection(uid), validId(expenseId))
  const snapshot = await getDoc(reference)
  if (!snapshot.exists()) return null
  if (snapshot.data().businessId !== businessId) throw new Error('This expense belongs to another business.')
  return { reference, expense: fromSnapshot(snapshot) }
}

export async function createExpense(businessId, input) {
  const fields = toExpenseFields(input)
  const uid = await ownedBusiness(businessId)
  const reference = await addDoc(expensesCollection(uid), {
    businessId,
    ...fields,
    source: 'manual',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return reference.id
}

export async function getExpenses(businessId) {
  const uid = await ownedBusiness(businessId)
  const snapshot = await getDocs(expenseQuery(uid, businessId))
  return snapshot.docs.map(fromSnapshot)
}

export function subscribeToExpenses(businessId, onData, onError) {
  let stopped = false
  let unsubscribe = () => {}
  ownedBusiness(businessId).then((uid) => {
    if (stopped) return
    unsubscribe = onSnapshot(expenseQuery(uid, businessId),
      (snapshot) => { if (!stopped) onData(snapshot.docs.map(fromSnapshot)) },
      (error) => { if (!stopped) onError(error) },
    )
  }).catch((error) => { if (!stopped) onError(error) })
  return () => { stopped = true; unsubscribe() }
}

export async function getExpenseById(businessId, expenseId) {
  return (await ownedExpense(businessId, expenseId))?.expense || null
}

export async function updateExpense(businessId, expenseId, input) {
  const fields = toExpenseFields(input)
  const record = await ownedExpense(businessId, expenseId)
  if (!record) throw new Error('Expense not found. Refresh the page and try again.')
  await updateDoc(record.reference, { ...fields, updatedAt: serverTimestamp() })
}

export async function deleteExpense(businessId, expenseId) {
  const record = await ownedExpense(businessId, expenseId)
  if (!record) throw new Error('Expense not found. Refresh the page and try again.')
  await deleteDoc(record.reference)
}
