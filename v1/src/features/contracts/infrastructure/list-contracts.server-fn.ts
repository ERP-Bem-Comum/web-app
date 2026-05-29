import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { serverFetch } from '@/server/http/result-fetch'
import { authMiddleware } from '@/server/middleware/auth'
import { ContractListFiltersSchema } from '../domain/schemas'
import { ContractId, mapBackendStatus } from '../domain/types'
import type { ContractRow, PaginatedContractRows, Money } from '../domain/types'

const backendListItemSchema = z.object({
  id: z.string().uuid(),
  sequentialNumber: z.string().optional(),
  title: z.string().optional(),
  originalValueCents: z.number().int().optional(),
  currentValueCents: z.number().int().optional(),
  currentPeriod: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  status: z.string(),
  counterpartyName: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

const backendListResponseSchema = z.object({
  items: z.array(backendListItemSchema).default([]),
  meta: z.object({
    itemCount: z.number(),
    totalItems: z.number(),
    itemsPerPage: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
  }),
})

export const listContracts = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(ContractListFiltersSchema)
  .handler(async ({ data, context }) => {
    const params = new URLSearchParams()
    if (data.page) params.set('page', String(data.page))
    if (data.limit) params.set('limit', String(data.limit))
    if (data.search) params.set('search', data.search)
    if (data.budgetPlanId) params.set('budgetPlanId', data.budgetPlanId)
    if (data.contractPeriodStart) params.set('contractPeriodStart', data.contractPeriodStart)
    if (data.contractPeriodEnd) params.set('contractPeriodEnd', data.contractPeriodEnd)
    if (data.contractType) params.set('contractType', data.contractType)
    if (data.contractStatus) params.set('contractStatus', data.contractStatus)
    if (data.order) params.set('order', data.order)

    const result = await serverFetch<unknown>(`/contracts?${params.toString()}`, {
      headers: {
        authorization: `Bearer ${context.accessToken}`,
      },
    })

    if (result.isErr()) {
      if (result.error.kind === 'http' && result.error.status === 403) {
        throw new Response('Sem permissão', { status: 403 })
      }
      if (result.error.kind === 'http') {
        throw new Response(JSON.stringify(result.error.body), { status: result.error.status })
      }
      throw new Response('Failed to fetch contracts', { status: 500 })
    }

    const parsed = backendListResponseSchema.safeParse(result.value)
    if (!parsed.success) {
      throw new Response('Invalid list response', { status: 500 })
    }

    const items: ContractRow[] = parsed.data.items.map((dto) => {
      const valueCents = dto.originalValueCents ?? dto.currentValueCents ?? 0
      const periodStart = dto.currentPeriod?.start
        ? new Date(dto.currentPeriod.start)
        : new Date()
      const periodEnd = dto.currentPeriod?.end ? new Date(dto.currentPeriod.end) : new Date()

      return {
        id: ContractId(dto.id),
        contractCode: (dto.sequentialNumber || dto.title || '—') as any,
        classification: 'Contrato' as any,
        contractModel: 'Serviço' as any,
        object: dto.title || dto.sequentialNumber || '—',
        totalValue: (valueCents / 100) as Money,
        contractPeriod: { start: periodStart, end: periodEnd },
        contractType: 'Fornecedor' as any,
        contractStatus: mapBackendStatus(dto.status),
        backendStatus: dto.status,
        files: [],
        createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
        updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
        supplier: dto.counterpartyName ? { name: dto.counterpartyName } : null,
        program: null,
        budgetPlan: null,
      } as ContractRow
    })

    return {
      items,
      meta: parsed.data.meta,
    } as PaginatedContractRows
  })
