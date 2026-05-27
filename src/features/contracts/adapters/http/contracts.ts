import { env } from '@/server/env'
import { resultFetch } from '@/shared/http/result-fetch'
import type { Contract, ContractId, ContractListFilters, PaginatedContractRows } from '../../domain/types'
import { ContractId as MakeContractId } from '../../domain/types'

export async function fetchContracts(
  filters: ContractListFilters,
  token: string,
): Promise<PaginatedContractRows> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.search) params.set('search', filters.search)
  if (filters.budgetPlanId) params.set('budgetPlanId', String(filters.budgetPlanId))
  if (filters.contractPeriodStart) params.set('contractPeriodStart', filters.contractPeriodStart)
  if (filters.contractPeriodEnd) params.set('contractPeriodEnd', filters.contractPeriodEnd)
  if (filters.contractType) params.set('contractType', filters.contractType)
  if (filters.contractStatus) params.set('contractStatus', filters.contractStatus)
  if (filters.order) params.set('order', filters.order)

  const res = await resultFetch(`${env.API_URL}/contracts?${params.toString()}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch contracts: ${res.error.kind}`)
  }

  const json = await res.value.json()

  return {
    items: (json.items || []).map(parseContractRow),
    meta: json.meta,
  }
}

export async function fetchContractById(
  id: ContractId,
  token: string,
): Promise<Contract | null> {
  const res = await resultFetch(`${env.API_URL}/contracts/${id}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    if (res.error.kind === 'http' && res.error.status === 404) return null
    throw new Error(`Failed to fetch contract: ${res.error.kind}`)
  }

  const json = await res.value.json()
  return parseContract(json)
}

function parseContractRow(dto: any): any {
  return {
    ...dto,
    id: MakeContractId(dto.id),
  }
}

function parseContract(dto: any): Contract {
  return {
    ...dto,
    id: MakeContractId(dto.id),
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  }
}
