import { createServerFn } from '@tanstack/react-start'
import { env } from './env'
import { resultFetch } from '@/shared/http/result-fetch'
import { authMiddleware } from './middleware/auth'

export const getSuppliers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const result = await resultFetch<any>(`${env.API_URL}/suppliers`, {
      headers: { authorization: `Bearer ${context.accessToken}` },
    })
    if (result.isErr()) {
      if (result.error.kind === 'http') {
        throw new Response(JSON.stringify(result.error.body), { status: result.error.status })
      }
      throw new Response('Failed to fetch suppliers', { status: 500 })
    }
    return result.value
  })

export const getFinanciers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const result = await resultFetch<any>(`${env.API_URL}/financiers`, {
      headers: { authorization: `Bearer ${context.accessToken}` },
    })
    if (result.isErr()) {
      if (result.error.kind === 'http') {
        throw new Response(JSON.stringify(result.error.body), { status: result.error.status })
      }
      throw new Response('Failed to fetch financiers', { status: 500 })
    }
    return result.value
  })

export const getCollaborators = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const result = await resultFetch<any>(`${env.API_URL}/collaborators`, {
      headers: { authorization: `Bearer ${context.accessToken}` },
    })
    if (result.isErr()) {
      if (result.error.kind === 'http') {
        throw new Response(JSON.stringify(result.error.body), { status: result.error.status })
      }
      throw new Response('Failed to fetch collaborators', { status: 500 })
    }
    return result.value
  })
