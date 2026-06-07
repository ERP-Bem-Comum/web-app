/**
 * Cliente HTTP do core-api para Acts — chama `/api/v1/acts/*`. NUNCA lança (tudo é Result; mappers
 * retornam Result, sem `throw`). Server-only (adapters). Anti-corruption layer: traduz o contrato REAL
 * do core-api ↔ Model do front (paginação legada, `registrationStatus`, create 201+Location, deactivate
 * SEM body) e mapeia o envelope de erro para `PartnersError`. Shape confirmado contra `act-schemas.ts`.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type { ActClient } from '#modules/partners/server/application/act/act.use-cases.ts'
import type {
  ListActsInput,
  ActListResponse,
  ActListItem,
  ActDetail,
} from '#modules/partners/server/domain/act/act.io.ts'
import type {
  RegistrationStatus,
  ActivationStatus,
  EmploymentRelationship,
} from '#modules/partners/server/domain/act/act.types.ts'
import { CoreApiActListSchema, CoreApiActDetailSchema, type CoreApiActItem } from './act.schema.ts'

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
const registrationFromApi = (s: 'PreRegistration' | 'Complete'): RegistrationStatus =>
  s === 'Complete' ? 'complete' : 'pre-registration'
const activationFromApi = (active: boolean): ActivationStatus => (active ? 'active' : 'inactive')
const employmentFromApi = (s: string): EmploymentRelationship => (s === 'PJ' ? 'PJ' : 'CLT')

const itemToModel = (a: CoreApiActItem): ActListItem => ({
  id: a.id,
  name: a.name,
  email: a.email,
  occupationArea: a.occupationArea,
  role: a.role,
  registration: registrationFromApi(a.registrationStatus),
  activation: activationFromApi(a.active),
})

const detailToModel = (raw: unknown): Result<ActDetail, PartnersError> => {
  const parsed = CoreApiActDetailSchema.safeParse(raw)
  if (!parsed.success) return err('server') // drift de contrato
  const a = parsed.data
  return ok({
    ...itemToModel(a),
    cpf: a.cpf,
    startOfContract: a.startOfContract,
    employmentRelationship: employmentFromApi(a.employmentRelationship),
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
  return p.toString()
}

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
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(10_000),
        })
      } catch {
        return err('connectivity')
      }
      if (!response.ok) return err(await mapResponseError(response))
      const location = response.headers.get('location')
      const id = location?.split('/').pop()
      if (id === undefined || id === '') return err('server')
      return fetchDetailById(id, token)
    },

    update: async (input, token) => {
      const { id, ...fields } = input
      const r = await resultFetch<unknown>(`${baseUrl}/acts/${id}`, {
        method: 'PUT',
        body: fields,
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    // deactivate: POST /acts/:id/deactivate SEM body (≠ Colaborador). Retorna 200 vazio → refetch.
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
