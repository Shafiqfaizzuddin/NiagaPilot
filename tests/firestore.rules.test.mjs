import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore'

let testEnvironment
const timestamp = Timestamp.fromDate(new Date('2026-10-28T00:00:00Z'))
const business = { name: 'Amina Market', category: 'Retail', description: '', location: '', currency: 'MYR', createdAt: timestamp, updatedAt: timestamp }
const expense = { businessId: 'business-1', description: 'Cooking oil', category: 'Ingredients', amountCents: 2550, transactionDate: '2026-10-28', paymentMethod: 'Cash', merchant: '', notes: '', source: 'manual', createdAt: timestamp, updatedAt: timestamp }
const profile = (uid) => ({ uid, fullName: `${uid} Owner`, email: `${uid}@example.com`, createdAt: timestamp, updatedAt: timestamp })

function owner(uid = 'alice') {
  return testEnvironment.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore()
}

async function denied(operation) {
  const error = await assertFails(operation)
  assert.equal(error.code, 'permission-denied')
}

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: 'demo-niagapilot',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  })
})

beforeEach(async () => {
  await testEnvironment.clearFirestore()
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const admin = context.firestore()
    for (const uid of ['alice', 'bob']) {
      await setDoc(doc(admin, 'users', uid), profile(uid))
      await setDoc(doc(admin, 'users', uid, 'businesses', 'business-1'), business)
      await setDoc(doc(admin, 'users', uid, 'expenses', 'expense-1'), expense)
    }
  })
})

after(async () => { await testEnvironment?.cleanup() })

test('owner can read their profile, business, and expense', async () => {
  const db = owner()
  await assertSucceeds(getDoc(doc(db, 'users/alice')))
  await assertSucceeds(getDoc(doc(db, 'users/alice/businesses/business-1')))
  await assertSucceeds(getDoc(doc(db, 'users/alice/expenses/expense-1')))
  const result = await assertSucceeds(getDocs(query(collection(db, 'users/alice/expenses'), where('businessId', '==', 'business-1'))))
  assert.equal(result.size, 1)
})

test('owner can create valid profile, business, and expense documents', async () => {
  const carol = owner('carol')
  await assertSucceeds(setDoc(doc(carol, 'users/carol'), { ...profile('carol'), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  await assertSucceeds(setDoc(doc(carol, 'users/carol/businesses/shop'), { ...business, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  await assertSucceeds(setDoc(doc(carol, 'users/carol/expenses/purchase'), { ...expense, businessId: 'shop', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
})

test('owner can update editable data and delete an expense', async () => {
  const db = owner()
  await assertSucceeds(updateDoc(doc(db, 'users/alice'), { fullName: 'Alice Updated', updatedAt: serverTimestamp() }))
  await assertSucceeds(updateDoc(doc(db, 'users/alice/businesses/business-1'), { name: 'Updated Market', updatedAt: serverTimestamp() }))
  await assertSucceeds(updateDoc(doc(db, 'users/alice/expenses/expense-1'), { description: 'Updated oil', amountCents: 3000, updatedAt: serverTimestamp() }))
  await assertSucceeds(deleteDoc(doc(db, 'users/alice/expenses/expense-1')))
  await denied(deleteDoc(doc(db, 'users/alice/businesses/business-1')))
})

test('unauthenticated clients cannot read or write user data', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  await denied(getDoc(doc(db, 'users/alice')))
  await denied(getDoc(doc(db, 'users/alice/businesses/business-1')))
  await denied(getDoc(doc(db, 'users/alice/expenses/expense-1')))
  await denied(setDoc(doc(db, 'users/alice/expenses/new'), { ...expense, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
})

test('cross-user reads, creates, updates, and deletes are denied', async () => {
  const db = owner('alice')
  await denied(getDoc(doc(db, 'users/bob')))
  await denied(getDoc(doc(db, 'users/bob/businesses/business-1')))
  await denied(getDoc(doc(db, 'users/bob/expenses/expense-1')))
  await denied(getDocs(collection(db, 'users/bob/expenses')))
  await denied(setDoc(doc(db, 'users/bob/businesses/new'), { ...business, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  await denied(setDoc(doc(db, 'users/bob/expenses/new'), { ...expense, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  await denied(updateDoc(doc(db, 'users/bob/expenses/expense-1'), { amountCents: 1, updatedAt: serverTimestamp() }))
  await denied(deleteDoc(doc(db, 'users/bob/expenses/expense-1')))
})

test('invalid amounts and unsupported categories are rejected', async () => {
  const db = owner()
  for (const amountCents of [-1, 0, 12.5, '2550', Number.NaN, Number.POSITIVE_INFINITY, 100000000000]) {
    await denied(setDoc(doc(db, 'users/alice/expenses', `bad-${String(amountCents).replace(/[^a-z0-9]/gi, '')}`), { ...expense, amountCents, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  }
  await denied(setDoc(doc(db, 'users/alice/expenses/bad-category'), { ...expense, category: 'Luxury', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
})

test('unexpected fields and malformed dates are rejected', async () => {
  const db = owner()
  await denied(setDoc(doc(db, 'users/alice/expenses/extra'), { ...expense, secret: 'unexpected', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  await denied(setDoc(doc(db, 'users/alice/businesses/extra'), { ...business, secret: 'unexpected', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  for (const transactionDate of ['2026-02-31', '2025-02-29', '2026-13-01', '2026-1-1', 'not-a-date']) {
    await denied(setDoc(doc(db, 'users/alice/expenses', `date-${transactionDate.replace(/[^a-z0-9]/gi, '')}`), { ...expense, transactionDate, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  }
  await assertSucceeds(setDoc(doc(db, 'users/alice/expenses/leap'), { ...expense, transactionDate: '2024-02-29', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
})

test('ownership, business association, and immutable fields cannot be modified', async () => {
  const db = owner()
  await denied(updateDoc(doc(db, 'users/alice'), { uid: 'bob', updatedAt: serverTimestamp() }))
  await denied(updateDoc(doc(db, 'users/alice/businesses/business-1'), { currency: 'USD', updatedAt: serverTimestamp() }))
  await denied(updateDoc(doc(db, 'users/alice/expenses/expense-1'), { businessId: 'other', updatedAt: serverTimestamp() }))
  await denied(updateDoc(doc(db, 'users/alice/expenses/expense-1'), { source: 'receipt', updatedAt: serverTimestamp() }))
  await denied(updateDoc(doc(db, 'users/alice/expenses/expense-1'), { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
})

test('expenses cannot refer to missing or another user business', async () => {
  const db = owner()
  await denied(setDoc(doc(db, 'users/alice/expenses/missing-business'), { ...expense, businessId: 'missing', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  await denied(setDoc(doc(db, 'users/alice/expenses/bobs-business'), { ...expense, businessId: 'bob-business', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
})
