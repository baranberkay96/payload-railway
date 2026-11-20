// Railway template (written for this template, MIT): first admin and password
// reset from variables. Runs in Payload's onInit, which completes before
// Payload serves any request, so /admin/create-first-user is never open.
import crypto from 'crypto'
import type { Payload } from 'payload'

const EMAIL_RE =
  /^[^\s@"'<>()[\],;:\\]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/

export const passwordProblem = (password: string): null | string => {
  if (password.length < 12) return 'shorter than 12 characters'
  if (password.length > 128) return 'longer than 128 characters'
  if (new Set(password).size < 4) return 'made of fewer than 4 different characters'
  return null
}

export const railwayBootstrap = async (payload: Payload): Promise<void> => {
  // The Docker build runs Next.js against a throwaway database; nothing to do there.
  if (process.env.RAILWAY_BUILD_DB === '1') return

  const log = (msg: string) => payload.logger.info(`[railway-bootstrap] ${msg}`)
  const warn = (msg: string) => payload.logger.warn(`[railway-bootstrap] ${msg}`)

  let email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    warn(`ADMIN_EMAIL='${email}' is not a valid e-mail address; using admin@example.com`)
    email = 'admin@example.com'
  }
  let password = String(process.env.ADMIN_PASSWORD || '')
  const problem = passwordProblem(password)
  if (problem) {
    warn(`ADMIN_PASSWORD is ${problem}.`)
    warn('Failing closed: a new site gets a random admin password nobody knows; an existing admin keeps')
    warn('the current password. Fix: set ADMIN_PASSWORD (12-128 characters) and RESET_ADMIN_PASSWORD=true')
    warn('on the Payload service, redeploy, log in, then set RESET_ADMIN_PASSWORD=false.')
    password = crypto.randomBytes(24).toString('base64url')
  }
  const name = String(process.env.ADMIN_NAME || '').trim().slice(0, 100) || 'Admin'

  const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
  if (totalDocs === 0) {
    // Throws on failure: Payload then fails to start instead of opening sign-up.
    await payload.create({
      collection: 'users',
      data: { email, name, password },
      overrideAccess: true,
    })
    log(`created the first admin ${email}; log in at /admin with ADMIN_EMAIL and ADMIN_PASSWORD.`)
    return
  }

  const reset = ['true', '1', 'yes'].includes(String(process.env.RESET_ADMIN_PASSWORD || '').toLowerCase())
  if (!reset) return
  if (problem) {
    warn('RESET_ADMIN_PASSWORD ignored: ADMIN_PASSWORD does not meet the rules above.')
    return
  }
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  if (!docs.length) {
    warn(`RESET_ADMIN_PASSWORD: no user with e-mail ${email}; nothing changed.`)
    return
  }
  await payload.update({
    collection: 'users',
    id: docs[0].id,
    data: { password, loginAttempts: 0, lockUntil: null },
    overrideAccess: true,
  })
  log(`RESET_ADMIN_PASSWORD: password of ${email} set from ADMIN_PASSWORD. Set RESET_ADMIN_PASSWORD=false now.`)
}
