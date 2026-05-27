import { createServerFn } from '@tanstack/react-start'
import { env } from './env'
import { resultFetch } from '@/shared/http/result-fetch'
import { authMiddleware } from './middleware/auth'
import { ContractListFiltersSchema } from '@/features/contracts/domain/schemas'

export const getContracts = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(ContractListFiltersSchema)
  .handler(async ({ data, context }) => {
    const params = new URLSearchParams()
    if (data.page) params.set('page', String(data.page))
    if (data.limit) params.set('limit', String(data.limit))
    if (data.search) params.set('search', data.search)
    if (data.budgetPlanId) params.set('budgetPlanId', String(data.budgetPlanId))
    if (data.contractPeriodStart) params.set('contractPeriodStart', data.contractPeriodStart)
    if (data.contractPeriodEnd) params.set('contractPeriodEnd', data.contractPeriodEnd)
    if (data.contractType) params.set('contractType', data.contractType)
    if (data.contractStatus) params.set('contractStatus', data.contractStatus)
    if (data.order) params.set('order', data.order)

    const res = await resultFetch(`${env.API_URL}/contracts?${params.toString()}`, {
      headers: {
        authorization: `Bearer ${context.session.token}`,
      },
    })

    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Failed to fetch contracts', { status: 500 })
    }

    return res.value.json()
  })

export const getContractById = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(
    // Inline validator for id
    (input: unknown) => {
      if (typeof input === 'object' && input !== null && 'id' in input) {
        return input as { id: number }
      }
      throw new Error('Invalid input')
    },
  )
  .handler(async ({ data, context }) => {
    const res = await resultFetch(`${env.API_URL}/contracts/${data.id}`, {
      headers: {
        authorization: `Bearer ${context.session.token}`,
      },
    })

    if (!res.ok) {
      if (res.error.kind === 'http' && res.error.status === 404) {
        throw new Response('Contract not found', { status: 404 })
      }
      throw new Response('Failed to fetch contract', { status: 500 })
    }

    return res.value.json()
  })
