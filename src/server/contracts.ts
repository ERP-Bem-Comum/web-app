import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { env } from './env'
import { resultFetch } from '@/shared/http/result-fetch'
import { authMiddleware } from './middleware/auth'
import {
  ContractListFiltersSchema,
  ContractCreateInputSchema,
  AditiveCreateInputSchema,
} from '@/features/contracts/domain/schemas'

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

const GetByIdSchema = z.object({ id: z.number() })

export const getContractById = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(GetByIdSchema)
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

export const createContract = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(ContractCreateInputSchema)
  .handler(async ({ data, context }) => {
    const res = await resultFetch(`${env.API_URL}/contracts`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${context.session.token}`,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Failed to create contract', { status: 500 })
    }

    return res.value.json()
  })

export const updateContract = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(ContractCreateInputSchema.extend({ id: z.number() }))
  .handler(async ({ data, context }) => {
    const { id, ...body } = data
    const res = await resultFetch(`${env.API_URL}/contracts/${id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${context.session.token}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Failed to update contract', { status: 500 })
    }

    return res.value.json()
  })

export const deleteContract = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    const res = await resultFetch(`${env.API_URL}/contracts/${data.id}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${context.session.token}`,
      },
    })

    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Failed to delete contract', { status: 500 })
    }

    return { success: true }
  })

export const createAditive = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(AditiveCreateInputSchema)
  .handler(async ({ data, context }) => {
    const res = await resultFetch(`${env.API_URL}/contracts/aditive`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${context.session.token}`,
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Failed to create aditive', { status: 500 })
    }

    return res.value.json()
  })

export const updateAditive = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(AditiveCreateInputSchema.extend({ id: z.number() }))
  .handler(async ({ data, context }) => {
    const { id, ...body } = data
    const res = await resultFetch(`${env.API_URL}/contracts/aditive/${id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${context.session.token}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Failed to update aditive', { status: 500 })
    }

    return res.value.json()
  })

export const updateContractStatusAndDoc = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.number(),
      signedContractUrl: z.string(),
      dataAssinatura: z.string(),
      contractStatus: z.string(),
    })
  )
  .handler(async ({ data, context }) => {
    const { id, ...body } = data
    const res = await resultFetch(`${env.API_URL}/contracts/${id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${context.session.token}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      if (res.error.kind === 'http') {
        throw new Response(JSON.stringify(res.error.body), { status: res.error.status })
      }
      throw new Response('Erro ao homologar contrato base', { status: 500 })
    }

    return res.value.json()
  })

export const getContractHistory = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    const res = await resultFetch(`${env.API_URL}/contracts/history/${data.id}`, {
      headers: {
        authorization: `Bearer ${context.session.token}`,
      },
    })

    if (!res.ok) {
      if (res.error.kind === 'http' && res.error.status === 404) {
        throw new Response('Contract not found', { status: 404 })
      }
      throw new Response('Failed to fetch contract history', { status: 500 })
    }

    return res.value.json()
  })
