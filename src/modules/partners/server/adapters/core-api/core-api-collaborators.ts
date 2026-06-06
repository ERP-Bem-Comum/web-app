/**
 * Cliente HTTP do core-api para colaboradores — chama `/api/v1/collaborators/*` via resultFetch.
 * NUNCA lança (tudo é Result). Server-only (adapters). Anti-corruption layer: traduz o contrato do
 * core-api ↔ Model do front e mapeia o envelope de erro para `PartnersError`.
 * Shape do response a confirmar contra o OpenAPI do core-api (`GET /docs/json`).
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
  CreateCollaboratorInput,
} from '#modules/partners/server/domain/collaborator/collaborator.io.ts'
import type {
  RegistrationStatus,
  ActivationStatus,
  DeactivationReason,
} from '#modules/partners/server/domain/collaborator/collaborator.types.ts'
import {
  CoreApiCollaboratorListSchema,
  CoreApiCollaboratorDetailSchema,
  CoreApiCollaboratorItemSchema,
  CoreApiImportResultSchema,
  type CoreApiCollaboratorItem,
} from './collaborator.schema.ts'

const SLUG_TO_ERROR: Partial<Record<string, PartnersError>> = {
  'collaborator-import-malformed': 'collaborator-import-malformed',
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
}

const mapHttpError = (e: HttpError): PartnersError => {
  switch (e.kind) {
    case 'http': {
      const slug = parseErrorEnvelope(e.body)?.error.code
      const bySlug = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
      if (bySlug !== undefined) return bySlug
      if (e.status === 404) return 'not-found'
      if (e.status === 401) return 'unauthorized'
      if (e.status === 403) return 'forbidden'
      if (e.status === 409) return 'conflict'
      if (e.status === 400 || e.status === 422) return 'validation'
      return 'server'
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

// ── Mappers: API → Model ────────────────────────────────────────────────────────
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

const detailToModel = (raw: unknown): CollaboratorDetail => {
  const parsed = CoreApiCollaboratorDetailSchema.safeParse(raw)
  if (!parsed.success) throw new Error(parsed.error.message)
  const c = parsed.data
  return {
    ...itemToModel(c),
    cpf: c.cpf,
    startOfContract: c.startOfContract,
    employmentRelationship: c.employmentRelationship,
  }
}

const listToModel = (raw: unknown): CollaboratorListResponse => {
  const parsed = CoreApiCollaboratorListSchema.safeParse(raw)
  if (!parsed.success) throw new Error(parsed.error.message)
  return { items: parsed.data.items.map(itemToModel), meta: parsed.data.meta }
}

// status do Model → status da API (filtro)
const registrationToApi = (s: RegistrationStatus): 'PreRegistration' | 'Complete' =>
  s === 'complete' ? 'Complete' : 'PreRegistration'

const buildListQuery = (input: ListCollaboratorsInput): string => {
  const p = new URLSearchParams()
  p.set('page', String(input.page))
  p.set('limit', String(input.limit))
  if (input.search) p.set('search', input.search)
  if (input.active !== undefined) p.set('active', input.active ? '1' : '0')
  if (input.status) p.set('status', registrationToApi(input.status))
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
    try {
      return ok(detailToModel(r.value))
    } catch {
      return err('server')
    }
  }

  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/collaborators?${buildListQuery(input)}`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      try {
        return ok(listToModel(r.value))
      } catch {
        return err('server')
      }
    },

    getById: fetchDetailById,

    create: async (input: CreateCollaboratorInput, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/collaborators`, {
        method: 'POST',
        body: input,
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      try {
        // 201 pode retornar o item (list-item) ou o detail. Tenta detail; cai p/ item + refetch.
        const asItem = CoreApiCollaboratorItemSchema.safeParse(r.value)
        if (asItem.success) {
          return ok({
            ...itemToModel(asItem.data),
            cpf: input.cpf,
            startOfContract: input.startOfContract,
            employmentRelationship: input.employmentRelationship,
          })
        }
        return ok(detailToModel(r.value))
      } catch {
        return err('server')
      }
    },

    deactivate: async (id, reason: DeactivationReason, token) => {
      // ⚠️ `disableBy` — alinhar os valores ao enum real do core-api na confirmação do contrato.
      const r = await resultFetch<unknown>(`${baseUrl}/collaborators/${id}/deactivate`, {
        method: 'POST',
        body: { disableBy: reason },
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      // O deactivate pode não retornar corpo útil → busca o estado atualizado.
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
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        let body: unknown
        try {
          body = JSON.parse(text)
        } catch {
          body = null
        }
        const slug = parseErrorEnvelope(body)?.error.code
        const bySlug = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
        if (bySlug !== undefined) return err(bySlug)
        if (response.status === 401) return err('unauthorized')
        if (response.status === 403) return err('forbidden')
        if (response.status === 400 || response.status === 422) return err('validation')
        return err('server')
      }
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
