import { spawn, spawnSync } from 'node:child_process'
import { loadEnv } from 'vite'

const local = loadEnv('development', process.cwd(), '')
const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'NEBIUS_API_KEY']
const missing = required.filter((name) => !local[name]?.trim())

if (missing.length) {
  console.error(`Local AI configuration is missing: ${missing.join(', ')}. Add these to .env.local.`)
  process.exit(1)
}

const env = { ...process.env }
for (const name of [...required, 'NEBIUS_MODEL', 'NEBIUS_BASE_URL']) {
  if (local[name]) env[name] = local[name]
}

const windows = process.platform === 'win32'
const child = spawn(windows ? 'cmd.exe' : 'npx', windows
  ? ['/d', '/s', '/c', 'npx --yes vercel@65.5.0 dev']
  : ['--yes', 'vercel@65.5.0', 'dev'], {
  env,
  stdio: 'inherit',
})

child.on('error', (error) => {
  console.error(`Could not start Vercel development server: ${error.message}`)
  process.exitCode = 1
})
child.on('exit', (code) => { if (!stopping) process.exitCode = code || 0 })

let stopping = false
function stop(signal) {
  if (stopping) return
  stopping = true
  if (windows && child.pid) {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    child.kill(signal)
  }
  process.exitCode = signal === 'SIGINT' ? 130 : 143
}

process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))
