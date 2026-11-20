// Railway template healthcheck: initializes Payload (migrations + first admin)
// and checks the database. 200 only when both work.
import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    await payload.count({ collection: 'users', overrideAccess: true })
    return new Response('ok\n', { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return new Response('starting\n', { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
