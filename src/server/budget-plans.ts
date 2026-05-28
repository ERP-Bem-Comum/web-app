import { createServerFn } from '@tanstack/react-start'
import { env } from './env'
import { resultFetch } from '@/shared/http/result-fetch'
import { authMiddleware } from './middleware/auth'

export const getBudgetPlans = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const result = await resultFetch<any>(`${env.API_URL}/budget-plans`, {
      headers: { authorization: `Bearer ${context.session.token}` },
    })
    if (result.isErr()) {
      if (result.error.kind === 'http') {
        throw new Response(JSON.stringify(result.error.body), { status: result.error.status })
      }
      throw new Response('Failed to fetch budget plans', { status: 500 })
    }
    return result.value
  })
