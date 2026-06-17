/**
 * Cliente HTTP do core-api para Suppliers — chama `/api/v1/suppliers/*`. NUNCA lança (tudo é Result).
 * Server-only (adapters). Anti-corruption layer: paginação legada, `active` boolean, create 201+Location,
 * deactivate/reactivate/PUT SEM body (200 vazio → refetch do detalhe). Shape confirmado contra
 * `supplier-schemas.ts`. CNPJ normalizado para 14 dígitos antes de enviar (o core-api exige `length(14)`).
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type { SupplierClient } from '#modules/partners/server/application/supplier/supplier.use-cases.ts'
import type {
  ListSuppliersInput,
  SupplierListResponse,
  SupplierListItem,
  SupplierDetail,
  CreateSupplierInput,
} from '#modules/partners/server/domain/supplier/supplier.io.ts'
import type {
  ActivationStatus,
  ServiceRating,
} from '#modules/partners/server/domain/supplier/supplier.types.ts'
import {
  CoreApiSupplierListSchema,
  CoreApiSupplierDetailSchema,
  CoreApiServiceCategoriesSchema,
  type CoreApiSupplierItem,
} from './supplier.schema.ts'

const SLUG_TO_ERROR: Partial<Record<string, PartnersError>> = {
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  'invalid-service-category': 'invalid-service-category',
  // Avaliação de serviço (§1.6): nível fora do enum → 422. A UI já restringe ao enum (defesa).
  'invalid-service-rating': 'validation',
}

// Níveis canônicos de avaliação (§1.6, D1). Leitura TOLERANTE (D2): valor desconhecido/null → null.
const SERVICE_RATINGS = ['RUIM', 'REGULAR', 'BOM', 'OTIMO'] as const
export const parseServiceRating = (raw: string | null | undefined): ServiceRating | null =>
  raw != null && (SERVICE_RATINGS as readonly string[]).includes(raw) ? (raw as ServiceRating) : null

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

const itemToModel = (s: CoreApiSupplierItem): SupplierListItem => ({
  id: s.id,
  name: s.name,
  email: s.email,
  cnpj: s.cnpj,
  corporateName: s.corporateName,
  fantasyName: s.fantasyName,
  serviceCategory: s.serviceCategory,
  activation: activationFromApi(s.active),
  contractCount: s.contractCount,
})

// Exportado p/ teste (supplier-rating.test): leitura tolerante da avaliação (§1.6, D2).
export const detailToModel = (raw: unknown): Result<SupplierDetail, PartnersError> => {
  const parsed = CoreApiSupplierDetailSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const s = parsed.data
  return ok({
    ...itemToModel(s),
    bankAccount: s.bankAccount,
    pixKey: s.pixKey,
    serviceRating: parseServiceRating(s.serviceRating),
    ratingComment: s.ratingComment ?? null,
  })
}

const listToModel = (raw: unknown): Result<SupplierListResponse, PartnersError> => {
  const parsed = CoreApiSupplierListSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const m = parsed.data.meta
  return ok({
    items: parsed.data.items.map(itemToModel),
    meta: { page: m.currentPage, limit: m.itemsPerPage, total: m.totalItems },
  })
}

const buildListQuery = (input: ListSuppliersInput): string => {
  const p = new URLSearchParams()
  p.set('page', String(input.page))
  p.set('limit', String(input.limit))
  p.set('order', input.order)
  if (input.search !== undefined && input.search !== '') p.set('search', input.search)
  if (input.active !== undefined) p.set('active', input.active ? '1' : '0')
  for (const c of input.categories ?? []) p.append('categories', c)
  return p.toString()
}

// Normaliza o CNPJ (14 dígitos) no corpo de escrita; demais campos passam direto. Avaliação de
// serviço (§1.6): serviceRating/ratingComment vão como null quando sem avaliação. Exportado p/ teste.
export const toWriteBody = (input: CreateSupplierInput): Record<string, unknown> => ({
  name: input.name,
  email: input.email,
  cnpj: onlyDigits(input.cnpj),
  corporateName: input.corporateName,
  fantasyName: input.fantasyName,
  serviceCategory: input.serviceCategory,
  bankAccount: input.bankAccount,
  pixKey: input.pixKey,
  serviceRating: input.serviceRating,
  ratingComment: input.ratingComment,
})

export const createCoreApiSuppliersClient = (baseUrl: string): SupplierClient => {
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

  const fetchDetailById = async (
    id: string,
    token: string,
  ): Promise<Result<SupplierDetail, PartnersError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/suppliers/${id}`, {
      method: 'GET',
      headers: auth(token),
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return detailToModel(r.value)
  }

  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/suppliers?${buildListQuery(input)}`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return listToModel(r.value)
    },

    getById: fetchDetailById,

    // create: 201 + Location, corpo vazio → fetch nativo + refetch do detalhe.
    create: async (input, token) => {
      let response: Response
      try {
        response = await globalThis.fetch(`${baseUrl}/suppliers`, {
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

    // PUT → 200 vazio → refetch.
    update: async (input, token) => {
      const { id } = input
      const r = await resultFetch<unknown>(`${baseUrl}/suppliers/${id}`, {
        method: 'PUT',
        body: toWriteBody(input),
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    // deactivate/reactivate: POST SEM body → 200 vazio → refetch.
    deactivate: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/suppliers/${id}/deactivate`, {
        method: 'POST',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    reactivate: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/suppliers/${id}/reactivate`, {
        method: 'POST',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    listServiceCategories: async (token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/suppliers/service-categories`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = CoreApiServiceCategoriesSchema.safeParse(r.value)
      return parsed.success ? ok(parsed.data) : err('server')
    },
  }
}
