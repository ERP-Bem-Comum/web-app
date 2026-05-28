import { env } from '@/server/env'
import { resultFetch } from '@/shared/http/result-fetch'
import type { Contract, ContractId, ContractListFilters, PaginatedContractRows } from '../../domain/types'
import { ContractId as MakeContractId } from '../../domain/types'
import type { AditiveCreateInput } from '../../domain/schemas'

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

  const result = await resultFetch<any>(`${env.API_URL}/contracts?${params.toString()}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  if (result.isErr()) {
    throw new Error(`Failed to fetch contracts: ${result.error.kind}`)
  }

  const json = await result.value

  return {
    items: (json.items || []).map(parseContractRow),
    meta: json.meta,
  }
}

export async function fetchContractById(
  id: ContractId,
  token: string,
): Promise<Contract | null> {
  const result = await resultFetch<any>(`${env.API_URL}/contracts/${id}`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  if (result.isErr()) {
    if (result.error.kind === 'http' && result.error.status === 404) return null
    throw new Error(`Failed to fetch contract: ${result.error.kind}`)
  }

  const json = await result.value
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

export async function createAditive(
  input: AditiveCreateInput,
  token: string,
): Promise<{ id: number }> {
  const result = await resultFetch<any>(`${env.API_URL}/contracts/aditive`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })

  if (result.isErr()) {
    throw new Error(`Failed to create aditive: ${result.error.kind}`)
  }

  return result.value
}
