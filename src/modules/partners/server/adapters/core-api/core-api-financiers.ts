/**
 * Cliente HTTP do core-api para Financiers — chama `/api/v1/financiers/*`. NUNCA lança (tudo é Result).
 * Server-only (adapters). ACL: paginação legada, `active` boolean, create 201+Location, deactivate/
 * reactivate/PUT SEM body (200 vazio → refetch). Shape confirmado contra `financier-schemas.ts`. CNPJ
 * normalizado para 14 dígitos antes de enviar.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type { FinancierClient } from '#modules/partners/server/application/financier/financier.use-cases.ts'
import type {
  ListFinanciersInput,
  FinancierListResponse,
  FinancierListItem,
  FinancierDetail,
  CreateFinancierInput,
} from '#modules/partners/server/domain/financier/financier.io.ts'
import type { ActivationStatus } from '#modules/partners/server/domain/financier/financier.types.ts'
import {
  CoreApiFinancierListSchema,
  CoreApiFinancierDetailSchema,
  type CoreApiFinancierItem,
} from './financier.schema.ts'

const SLUG_TO_ERROR: Partial<Record<string, PartnersError>> = {
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
}

const statusToError = (status: number, slug: string | undefined): PartnersError => {
  const bySlug = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
  if (bySlug !== undefined) return bySlug
  if (status === 404) return 'not-found'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 409) return 'conflict'
  if (status === 400 || status === 422) return 'validation'
  return 'server'
}

const mapHttpError = (e: HttpError): PartnersError => {
  switch (e.kind) {
    case 'http':
      return statusToError(e.status, parseErrorEnvelope(e.body)?.error.code)
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

const mapResponseError = async (response: Response): Promise<PartnersError> => {
  const text = await response.text().catch(() => '')
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    body = null
  }
  return statusToError(response.status, parseErrorEnvelope(body)?.error.code)
}

const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')
const activationFromApi = (active: boolean): ActivationStatus => (active ? 'active' : 'inactive')

const itemToModel = (f: CoreApiFinancierItem): FinancierListItem => ({
  id: f.id,
  name: f.name,
  corporateName: f.corporateName,
  legalRepresentative: f.legalRepresentative,
  cnpj: f.cnpj,
  telephone: f.telephone,
  activation: activationFromApi(f.active),
})

const detailToModel = (raw: unknown): Result<FinancierDetail, PartnersError> => {
  const parsed = CoreApiFinancierDetailSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const f = parsed.data
  return ok({
    ...itemToModel(f),
    legalRepresentative: f.legalRepresentative,
    address: f.address,
    bankAccount: f.bankAccount,
    pixKey: f.pixKey,
  })
}

const listToModel = (raw: unknown): Result<FinancierListResponse, PartnersError> => {
  const parsed = CoreApiFinancierListSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const m = parsed.data.meta
  return ok({
    items: parsed.data.items.map(itemToModel),
    meta: { page: m.currentPage, limit: m.itemsPerPage, total: m.totalItems },
  })
}

const buildListQuery = (input: ListFinanciersInput): string => {
  const p = new URLSearchParams()
  p.set('page', String(input.page))
  p.set('limit', String(input.limit))
  p.set('order', input.order)
  if (input.search !== undefined && input.search !== '') p.set('search', input.search)
  if (input.active !== undefined) p.set('active', input.active ? '1' : '0')
  return p.toString()
}

const toWriteBody = (input: CreateFinancierInput): Record<string, unknown> => ({
  name: input.name,
  corporateName: input.corporateName,
  legalRepresentative: input.legalRepresentative,
  cnpj: onlyDigits(input.cnpj),
  telephone: input.telephone,
  address: input.address,
  bankAccount: input.bankAccount,
  pixKey: input.pixKey,
})

export const createCoreApiFinanciersClient = (baseUrl: string): FinancierClient => {
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

  const fetchDetailById = async (
    id: string,
    token: string,
  ): Promise<Result<FinancierDetail, PartnersError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/financiers/${id}`, {
      method: 'GET',
      headers: auth(token),
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return detailToModel(r.value)
  }

  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/financiers?${buildListQuery(input)}`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return listToModel(r.value)
    },

    getById: fetchDetailById,

    create: async (input, token) => {
      let response: Response
      try {
        response = await globalThis.fetch(`${baseUrl}/financiers`, {
          method: 'POST',
          headers: { ...auth(token), 'Content-Type': 'application/json' },
          body: JSON.stringify(toWriteBody(input)),
          signal: AbortSignal.timeout(10_000),
        })
      } catch {
        return err('connectivity')
      }
      if (!response.ok) return err(await mapResponseError(response))
      const id = response.headers.get('location')?.split('/').pop()
      if (id === undefined || id === '') return err('server')
      return fetchDetailById(id, token)
    },

    update: async (input, token) => {
      const { id } = input
      const r = await resultFetch<unknown>(`${baseUrl}/financiers/${id}`, {
        method: 'PUT',
        body: toWriteBody(input),
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    deactivate: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/financiers/${id}/deactivate`, {
        method: 'POST',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    reactivate: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/financiers/${id}/reactivate`, {
        method: 'POST',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },
  }
}
