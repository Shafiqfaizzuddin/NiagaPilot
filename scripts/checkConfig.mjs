import { createPrivateKey } from 'node:crypto'
import { loadEnv } from 'vite'

const values = loadEnv('development', process.cwd(), '')
const required = [
  'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID',
  'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY',
  'NEBIUS_API_KEY',
]
const missing = required.filter((name) => !values[name]?.trim())
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

if (values.FIREBASE_PROJECT_ID !== values.VITE_FIREBASE_PROJECT_ID) {
  console.error('The Firebase Admin and web app project IDs do not match.')
  process.exit(1)
}
if (!values.FIREBASE_CLIENT_EMAIL.endsWith(`@${values.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`)) {
  console.error('The Firebase service account email does not match the project ID.')
  process.exit(1)
}

const privateKey = values.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
try {
  createPrivateKey(privateKey)
} catch (error) {
  const hasHeader = privateKey.includes('-----BEGIN PRIVATE KEY-----')
  const hasFooter = privateKey.includes('-----END PRIVATE KEY-----')
  const hasLineBreaks = privateKey.includes('\n')
  console.error(`FIREBASE_PRIVATE_KEY is not a valid private key (header: ${hasHeader}, footer: ${hasFooter}, line breaks: ${hasLineBreaks}; crypto: ${error.code || 'invalid'}).`)
  process.exit(1)
}

console.log('Firebase web settings, Firebase Admin credentials, and Nebius settings are present and structurally valid.')

if (process.argv.includes('--online')) {
  for (const name of ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']) {
    process.env[name] = values[name]
  }
  const { getAdminServices } = await import('../server/admin.js')
  const { auth, db } = getAdminServices()
  const checks = [
    ['Firebase Authentication', () => auth.listUsers(1)],
    ['Cloud Firestore', () => db.doc('niagapilotHealthcheck/status').get()],
  ]
  for (const [label, operation] of checks) {
    let timer
    try {
      await Promise.race([
        operation(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 15000) }),
      ])
      console.log(`${label}: connected`)
    } catch (error) {
      console.error(`${label}: connection failed (${error.code || 'network or permissions'})`)
      process.exitCode = 1
    } finally {
      clearTimeout(timer)
    }
  }
}

if (process.argv.includes('--provider')) {
  process.env.NEBIUS_API_KEY = values.NEBIUS_API_KEY
  if (values.NEBIUS_MODEL) process.env.NEBIUS_MODEL = values.NEBIUS_MODEL
  if (values.NEBIUS_BASE_URL) process.env.NEBIUS_BASE_URL = values.NEBIUS_BASE_URL
  const { callNemotron } = await import('../server/nebius.js')
  try {
    await callNemotron([
      { role: 'system', content: 'Reply with one short greeting.' },
      { role: 'user', content: 'Say hello.' },
    ], 40)
    console.log('Nebius Nemotron: connected')
  } catch (error) {
    console.error(`Nebius Nemotron: connection failed (${error.code || 'provider error'})`)
    process.exitCode = 1
  }
}

process.exit(process.exitCode || 0)
