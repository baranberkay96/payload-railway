// Start Payload (Next.js standalone server) on Railway. Written for this
// template, MIT.
//  - Deploy-form values never fail the deploy (STANDARD 8.29).
//  - Waits up to 15 minutes for Postgres (services start in parallel).
//  - Starts server.js, forwards SIGTERM, and warms up /health so migrations
//    and the first-admin bootstrap run right after the port opens.
import { spawn } from 'node:child_process'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const log = (msg) => console.log(`[railway-start] ${msg}`)
const warn = (msg) => console.error(`[railway-start] WARNING: ${msg}`)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const port = Number(process.env.PORT)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  if (process.env.PORT) warn(`PORT='${process.env.PORT}' is not a port number; using 3000`)
  process.env.PORT = '3000'
}
// Next's standalone server reads HOSTNAME; :: = IPv4 and IPv6.
if (!process.env.HOSTNAME || !/^[0-9a-fA-F:.]+$/.test(process.env.HOSTNAME)) process.env.HOSTNAME = '::'
if (!process.env.PAYLOAD_SECRET) warn('PAYLOAD_SECRET is empty; Payload cannot start. Set it on the Payload service.')

function canConnect(host, p) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: p, timeout: 4000 })
    const done = (ok) => { socket.destroy(); resolve(ok) }
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

async function waitForDatabase() {
  let target
  try {
    target = new URL(process.env.DATABASE_URL || '')
  } catch {
    warn('DATABASE_URL is missing or invalid; Payload will fail to connect.')
    return
  }
  const host = target.hostname.replace(/^\[|\]$/g, '')
  const p = Number(target.port || 5432)
  const started = Date.now()
  for (let i = 0; !(await canConnect(host, p)); i++) {
    if (Date.now() - started > 15 * 60 * 1000) {
      warn(`Postgres at ${host}:${p} not reachable after 15 minutes; starting anyway.`)
      return
    }
    if (i % 6 === 0) log(`waiting for Postgres at ${host}:${p} ...`)
    await sleep(5000)
  }
  log(`Postgres at ${host}:${p} is reachable.`)
}

const health = () =>
  new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port: Number(process.env.PORT), path: '/health', timeout: 120000 }, (res) => {
      res.resume()
      resolve(res.statusCode)
    })
    req.on('timeout', () => req.destroy())
    req.on('error', () => resolve(0))
  })

await waitForDatabase()
log(`starting Payload on [${process.env.HOSTNAME}]:${process.env.PORT}`)
const child = spawn(process.execPath, ['server.js'], { cwd: appDir, stdio: 'inherit', env: process.env })
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => child.kill(sig))
child.on('exit', (code, signal) => {
  log(`Payload exited (${signal || code})`)
  process.exit(code === null ? 1 : code)
})

for (let i = 0; i < 300; i++) {
  await sleep(2000)
  const status = await health()
  if (status === 200) {
    log('Payload is ready (database migrated, admin present).')
    break
  }
}
