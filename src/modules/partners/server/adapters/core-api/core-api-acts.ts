/**
 * Cliente HTTP do core-api para Acts — chama `/api/v1/acts/*`. NUNCA lança (tudo é Result; mappers
 * retornam Result, sem `throw`). Server-only (adapters). Anti-corruption layer: traduz o contrato REAL
 * do #32 (Acordo de Cooperação Técnica institucional) ↔ Model do front (paginação legada, `active`
 * boolean, create 201+Location, deactivate/reactivate SEM body) e mapeia o envelope de erro para
 * `PartnersError`. CNPJ normalizado p/ 14 dígitos antes de enviar (o core-api exige só-dígitos).
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import { normalizeCnpj } from '#shared/document/cnpj.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type { ActClient } from '#modules/partners/server/application/act/act.use-cases.ts'
import type {
  ListActsInput,
  ActListResponse,
  ActListItem,
  ActDetail,
  CreateActInput,
} from '#modules/partners/server/domain/act/act.io.ts'
import { CoreApiActListSchema, CoreApiActDetailSchema, type CoreApiActItem } from './act.schema.ts'

export const SLUG_TO_ERROR: Partial<Record<string, PartnersError>> = {
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  'register-act-number-duplicate': 'act-number-duplicate',
  'edit-act-number-duplicate': 'act-number-duplicate',
  'act-number-duplicate': 'act-number-duplicate',
  'invalid-cnpj': 'invalid-cnpj',
  'period-end-before-start': 'invalid-act-period',
  'period-zero-duration': 'invalid-act-period',
  'act-payment-target-required': 'act-payment-target-required',
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

// Erro de uma Response do `fetch` nativo (usado no create 201, onde o resultFetch não serve).
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

// ── Mappers: API → Model (errors-as-values: retornam Result, sem throw) ─────────────
export const itemToModel = (a: CoreApiActItem): ActListItem => ({
  id: a.id,
  actNumber: a.actNumber,
  name: a.name,
  email: a.email,
  corporateName: a.corporateName,
  fantasyName: a.fantasyName,
  occupationArea: a.occupationArea,
  hasFinancialTransfer: a.hasFinancialTransfer,
  active: a.active,
  contractCount: a.contractCount,
})

export const detailToModel = (raw: unknown): Result<ActDetail, PartnersError> => {
  const parsed = CoreApiActDetailSchema.safeParse(raw)
  if (!parsed.success) return err('server') // drift de contrato
  const a = parsed.data
  return ok({
    ...itemToModel(a),
    legacyId: a.legacyId,
    cnpj: a.cnpj,
    legalRepresentative: a.legalRepresentative,
    startDate: a.startDate,
    endDate: a.endDate,
    bankAccount: a.bankAccount,
    pixKey: a.pixKey,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  })
}

const listToModel = (raw: unknown): Result<ActListResponse, PartnersError> => {
  const parsed = CoreApiActListSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const m = parsed.data.meta
  return ok({
    items: parsed.data.items.map(itemToModel),
    meta: { page: m.currentPage, limit: m.itemsPerPage, total: m.totalItems },
  })
}

const buildListQuery = (input: ListActsInput): string => {
  const p = new URLSearchParams()
  p.set('page', String(input.page))
  p.set('limit', String(input.limit))
  p.set('order', input.order)
  if (input.search !== undefined && input.search !== '') p.set('search', input.search)
  if (input.active !== undefined) p.set('active', input.active ? '1' : '0')
  if (input.hasFinancialTransfer !== undefined)
    p.set('hasFinancialTransfer', input.hasFinancialTransfer ? '1' : '0')
  if (input.occupationArea !== undefined) p.set('occupationArea', input.occupationArea)
  return p.toString()
}

// Normaliza o CNPJ (14 dígitos) no corpo de escrita; conta/PIX/datas/flag passam direto.
export const toWriteBody = (input: CreateActInput): Record<string, unknown> => ({
  actNumber: input.actNumber,
  name: input.name,
  email: input.email,
  cnpj: normalizeCnpj(input.cnpj),
  corporateName: input.corporateName,
  fantasyName: input.fantasyName,
  occupationArea: input.occupationArea,
  legalRepresentative: input.legalRepresentative,
  startDate: input.startDate,
  endDate: input.endDate,
  hasFinancialTransfer: input.hasFinancialTransfer,
  bankAccount: input.bankAccount,
  pixKey: input.pixKey,
})

export const createCoreApiActsClient = (baseUrl: string): ActClient => {
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

  const fetchDetailById = async (id: string, token: string): Promise<Result<ActDetail, PartnersError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/acts/${id}`, { method: 'GET', headers: auth(token) })
    if (isErr(r)) return err(mapHttpError(r.error))
    return detailToModel(r.value)
  }

  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/acts?${buildListQuery(input)}`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return listToModel(r.value)
    },

    getById: fetchDetailById,

    // create: o core-api responde 201 + header `Location` com CORPO VAZIO. `resultFetch` descarta headers,
    // então usamos `fetch` nativo, lemos o `Location` e fazemos refetch do detalhe.
    create: async (input, token) => {
      let response: Response
      try {
        response = await globalThis.fetch(`${baseUrl}/acts`, {
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
      const r = await resultFetch<unknown>(`${baseUrl}/acts/${id}`, {
        method: 'PUT',
        body: toWriteBody(input),
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    // deactivate/reactivate: POST SEM body → 200 vazio → refetch.
    deactivate: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/acts/${id}/deactivate`, {
        method: 'POST',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    reactivate: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/acts/${id}/reactivate`, {
        method: 'POST',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },
  }
}
