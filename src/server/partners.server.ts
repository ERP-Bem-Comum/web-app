import { createServerFn } from '@tanstack/react-start'
import { env } from './env'
import { resultFetch } from '@/shared/http/result-fetch'
import { authMiddleware } from './middleware/auth'

export const getSuppliers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const res = await resultFetch(`${env.API_URL}/suppliers`, {
      headers: { authorization: `Bearer ${context.session.token}` },
    })
    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Failed to fetch suppliers', { status: 500 })
    }
    return res.value.json()
  })

export const getFinanciers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const res = await resultFetch(`${env.API_URL}/financiers`, {
      headers: { authorization: `Bearer ${context.session.token}` },
    })
    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Failed to fetch financiers', { status: 500 })
    }
    return res.value.json()
  })

export const getCollaborators = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const res = await resultFetch(`${env.API_URL}/collaborators`, {
      headers: { authorization: `Bearer ${context.session.token}` },
    })
    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Failed to fetch collaborators', { status: 500 })
    }
    return res.value.json()
  })
