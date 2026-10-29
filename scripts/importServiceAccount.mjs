import { createPrivateKey } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'

const source = process.argv[2]
if (!source) {
  console.error('Usage: npm run import:service-account -- <path-to-downloaded-json>')
  process.exit(1)
}

let account
try {
  account = JSON.parse(await readFile(resolve(source), 'utf8'))
  if (account.type !== 'service_account' || !account.project_id || !account.client_email || !account.private_key) {
    throw new Error('Invalid service account')
  }
  createPrivateKey(account.private_key)
} catch {
  console.error('The selected file is not a valid Firebase service-account JSON file.')
  process.exit(1)
}

const webProjectId = loadEnv('development', process.cwd(), '').VITE_FIREBASE_PROJECT_ID
if (account.project_id !== webProjectId) {
  console.error('The service account belongs to a different Firebase project than the web app.')
  process.exit(1)
}

const environmentPath = resolve('.env.local')
let lines
try {
  lines = (await readFile(environmentPath, 'utf8')).split(/\r?\n/)
} catch {
  console.error('.env.local is missing. Create it from .env.example first.')
  process.exit(1)
}

const updates = {
  FIREBASE_PROJECT_ID: account.project_id,
  FIREBASE_CLIENT_EMAIL: account.client_email,
  FIREBASE_PRIVATE_KEY: `"${account.private_key.replace(/\r?\n/g, '\\n')}"`,
}
for (const [name, value] of Object.entries(updates)) {
  const line = `${name}=${value}`
  const index = lines.findIndex((item) => new RegExp(`^\\s*${name}\\s*=`).test(item))
  if (index === -1) lines.push(line)
  else lines[index] = line
}

await writeFile(environmentPath, lines.join('\n'), 'utf8')
console.log('Firebase Admin credentials imported into ignored .env.local. No credential values were printed.')
