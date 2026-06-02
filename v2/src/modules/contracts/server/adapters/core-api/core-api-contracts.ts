/**
 * Cliente HTTP do core-api para contratos — chama `/api/v2/contracts/*`.
 * Converte envelope de erro em ContractsError. NUNCA lança (tudo é Result).
 * Server-only (server/adapters).
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { ContractsError } from '#modules/contracts/server/adapters/contracts-shared.types.ts'
import type {
  CreateContractInput,
  UpdateContractInput,
  CreateAmendmentInput,
  ListContractsInput,
} from '#modules/contracts/server/domain/contracts.types.ts'

const SLUG_TO_ERROR: Partial<Record<string, ContractsError>> = {
  'contract-not-found': 'contract-not-found',
  'amendment-not-found': 'amendment-not-found',
  'invalid-value': 'invalid-value',
  'invalid-period': 'invalid-period',
  'missing-contractor': 'missing-contractor',
  unauthorized: 'unauthorized',
}

const mapHttpError = (e: HttpError): ContractsError => {
  switch (e.kind) {
    case 'http': {
      const slug = parseErrorEnvelope(e.body)?.error.code
      const mapped = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
      return mapped ?? 'server'
    }
    case 'network':
    case 'timeout':
      return 'connectivity'
    case 'parse':
    case 'aborted':
      return 'server'
    default: {
      const exhaustive: never = e
      return exhaustive
    }
  }
}

export type CoreApiContractsClient = Readonly<{
  list: (input: ListContractsInput, token: string) => Promise<Result<unknown, ContractsError>>
  getById: (id: string, token: string) => Promise<Result<unknown, ContractsError>>
  create: (input: CreateContractInput, token: string) => Promise<Result<unknown, ContractsError>>
  update: (input: UpdateContractInput, token: string) => Promise<Result<unknown, ContractsError>>
  createAmendment: (contractId: string, input: CreateAmendmentInput, token: string) => Promise<Result<unknown, ContractsError>>
  getHistory: (id: string, token: string) => Promise<Result<unknown, ContractsError>>
}>

export const createCoreApiContractsClient = (baseUrl: string): CoreApiContractsClient => {
  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` })

  const toQuery = (input: ListContractsInput): string => {
    const params = new URLSearchParams()
    params.set('page', String(input.page))
    params.set('limit', String(input.limit))
    if (input.search) params.set('search', input.search)
    if (input.contractType) params.set('contractType', input.contractType)
    if (input.status) params.set('status', input.status)
    params.set('order', input.order)
    return params.toString()
  }

  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts?${toQuery(input)}`, {
        method: 'GET',
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },

    getById: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${id}`, {
        method: 'GET',
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },

    create: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts`, {
        method: 'POST',
        body: input,
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },

    update: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${input.id}`, {
        method: 'PATCH',
        body: input,
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },

    createAmendment: async (contractId, input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${contractId}/amendments`, {
        method: 'POST',
        body: input,
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },

    getHistory: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/contracts/${id}/history`, {
        method: 'GET',
        headers: authHeader(token),
      })
      return isErr(r) ? err(mapHttpError(r.error)) : ok(r.value)
    },
  }
}
