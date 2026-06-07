/**
 * Cliente HTTP do core-api para colaboradores — chama `/api/v1/collaborators/*`. NUNCA lança (tudo é
 * Result; mappers retornam Result, sem `throw`). Server-only (adapters). Anti-corruption layer: traduz o
 * contrato REAL do core-api ↔ Model do front (paginação legada, occupationArea string, create 201+Location)
 * e mapeia o envelope de erro para `PartnersError`. Shape confirmado contra os schemas Zod do core-api.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type { CollaboratorClient } from '#modules/partners/server/application/collaborator/collaborator.use-cases.ts'
import type {
  ListCollaboratorsInput,
  CollaboratorListResponse,
  CollaboratorListItem,
  CollaboratorDetail,
} from '#modules/partners/server/domain/collaborator/collaborator.io.ts'
import type {
  RegistrationStatus,
  ActivationStatus,
  DeactivationReason,
} from '#modules/partners/server/domain/collaborator/collaborator.types.ts'
import {
  CoreApiCollaboratorListSchema,
  CoreApiCollaboratorDetailSchema,
  CoreApiImportResultSchema,
  type CoreApiCollaboratorItem,
} from './collaborator.schema.ts'

const SLUG_TO_ERROR: Partial<Record<string, PartnersError>> = {
  'collaborator-import-malformed': 'collaborator-import-malformed',
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

// Erro de uma Response do `fetch` nativo (usado onde o resultFetch não serve: import text/csv, create 201).
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

const itemToModel = (c: CoreApiCollaboratorItem): CollaboratorListItem => ({
  id: c.id,
  name: c.name,
  email: c.email,
  occupationArea: c.occupationArea,
  role: c.role,
  registration: registrationFromApi(c.status),
  activation: activationFromApi(c.active),
})

const detailToModel = (raw: unknown): Result<CollaboratorDetail, PartnersError> => {
  const parsed = CoreApiCollaboratorDetailSchema.safeParse(raw)
  if (!parsed.success) return err('server') // drift de contrato — diagnóstico via parsed.error se necessário
  const c = parsed.data
  return ok({
    ...itemToModel(c),
    cpf: c.cpf,
    startOfContract: c.startOfContract,
    employmentRelationship: c.employmentRelationship,
  })
}

const listToModel = (raw: unknown): Result<CollaboratorListResponse, PartnersError> => {
  const parsed = CoreApiCollaboratorListSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const m = parsed.data.meta
  return ok({
    items: parsed.data.items.map(itemToModel),
    meta: { page: m.currentPage, limit: m.itemsPerPage, total: m.totalItems },
  })
}

// status do Model → status da API (filtro de lista)
const registrationToApi = (s: RegistrationStatus): 'PreRegistration' | 'Complete' =>
  s === 'complete' ? 'Complete' : 'PreRegistration'

const buildListQuery = (input: ListCollaboratorsInput): string => {
  const p = new URLSearchParams()
  p.set('page', String(input.page))
  p.set('limit', String(input.limit))
  if (input.search !== undefined && input.search !== '') p.set('search', input.search)
  if (input.active !== undefined) p.set('active', input.active ? '1' : '0')
  if (input.status !== undefined) p.append('status', registrationToApi(input.status)) // core-api: status é array
  for (const oa of input.occupationAreas ?? []) p.append('occupationAreas', oa)
  for (const er of input.employmentRelationships ?? []) p.append('employmentRelationships', er)
  for (const r of input.roles ?? []) p.append('roles', r)
  if (input.yearOfContract !== undefined) p.set('yearOfContract', String(input.yearOfContract))
  return p.toString()
}

export const createCoreApiCollaboratorsClient = (baseUrl: string): CollaboratorClient => {
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

  const fetchDetailById = async (id: string, token: string): Promise<Result<CollaboratorDetail, PartnersError>> => {
    const r = await resultFetch<unknown>(`${baseUrl}/collaborators/${id}`, { method: 'GET', headers: auth(token) })
    if (isErr(r)) return err(mapHttpError(r.error))
    return detailToModel(r.value)
  }

  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/collaborators?${buildListQuery(input)}`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return listToModel(r.value)
    },

    getById: fetchDetailById,

    // create: o core-api responde 201 + header `Location` com CORPO VAZIO (não o recurso). `resultFetch`
    // descarta headers, então usamos `fetch` nativo, lemos o `Location` e fazemos refetch do detalhe.
    create: async (input, token) => {
      let response: Response
      try {
        response = await globalThis.fetch(`${baseUrl}/collaborators`, {
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

    completeRegistration: async (input, token) => {
      const { id, ...fields } = input
      const r = await resultFetch<unknown>(`${baseUrl}/collaborators/${id}/complete-registration`, {
        method: 'PATCH',
        body: fields,
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    update: async (input, token) => {
      const { id, ...fields } = input
      const r = await resultFetch<unknown>(`${baseUrl}/collaborators/${id}`, {
        method: 'PUT',
        body: fields,
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    deactivate: async (id, reason: DeactivationReason, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/collaborators/${id}/deactivate`, {
        method: 'POST',
        body: { disableBy: reason },
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      // deactivate não retorna corpo útil → busca o estado atualizado.
      return fetchDetailById(id, token)
    },

    reactivate: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/collaborators/${id}/reactivate`, {
        method: 'POST',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return fetchDetailById(id, token)
    },

    // Import em lote: o core-api aceita `text/csv` cru (NÃO multipart). `resultFetch` força JSON, então
    // aqui usamos `fetch` nativo direto. Resposta sempre 200 com o relatório parcial { created, failed }.
    importCsv: async (input, token) => {
      let response: Response
      try {
        response = await globalThis.fetch(`${baseUrl}/collaborators/import`, {
          method: 'POST',
          headers: { ...auth(token), 'Content-Type': 'text/csv' },
          body: input.csv,
          signal: AbortSignal.timeout(30_000),
        })
      } catch {
        return err('connectivity')
      }
      if (!response.ok) return err(await mapResponseError(response))
      try {
        const data: unknown = await response.json()
        const parsed = CoreApiImportResultSchema.safeParse(data)
        return parsed.success ? ok(parsed.data) : err('server')
      } catch {
        return err('server')
      }
    },
  }
}
