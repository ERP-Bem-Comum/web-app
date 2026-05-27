import { createServerFn } from '@tanstack/react-start'
import { env } from './env'
import { resultFetch } from '@/shared/http/result-fetch'
import { authMiddleware } from './middleware/auth'

export const getBudgetPlans = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const res = await resultFetch(`${env.API_URL}/budget-plans`, {
      headers: { authorization: `Bearer ${context.session.token}` },
    })
    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Failed to fetch budget plans', { status: 500 })
    }
    return res.value.json()
  })
