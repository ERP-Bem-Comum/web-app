/**
 * Cliente HTTP do core-api para Programs — chama `/api/v1/programs`. NUNCA lança (tudo é Result; mappers
 * retornam Result, sem `throw`). Server-only (adapters). Anti-corruption layer: traduz o contrato REAL
 * do core-api ↔ Model do front (meta harmonizada, null→'') e mapeia o envelope de erro para `ProgramsError`.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { ProgramsError } from '#modules/programs/server/domain/errors/programs.errors.ts'
import type { ProgramClient } from '#modules/programs/server/application/programs.use-cases.ts'
import type {
  ListProgramsInput,
  ProgramListItem,
  ProgramListResponse,
  ProgramDetail,
} from '#modules/programs/server/domain/program.io.ts'
import {
  CoreApiProgramListSchema,
  CoreApiProgramDetailSchema,
  type CoreApiProgramItem,
  type CoreApiProgramDetail,
} from './programs.schema.ts'

const SLUG_TO_ERROR: Partial<Record<string, ProgramsError>> = {
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  'program-not-found': 'not-found',
  'program-sigla-duplicated': 'sigla-duplicated',
  'program-version-conflict': 'version-conflict',
  'program-not-active': 'conflict',
  'program-not-inactive': 'conflict',
  'program-repo-conflict': 'conflict',
}

const statusToError = (status: number, slug: string | undefined): ProgramsError => {
  const bySlug = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
  if (bySlug !== undefined) return bySlug
  if (status === 404) return 'not-found'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 409) return 'conflict'
  if (status === 400 || status === 422) return 'validation'
  return 'server'
}

const mapHttpError = (e: HttpError): ProgramsError => {
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

// ── Mappers: API → Model ─────────────────────────────────────────────────────
const itemToModel = (p: CoreApiProgramItem): ProgramListItem => ({
  id: p.id,
  programNumber: p.programNumber,
  name: p.name,
  sigla: p.sigla,
  generalCharacteristics: p.generalCharacteristics ?? '',
  logoKey: p.logoKey,
  status: p.status,
})

const detailToModel = (raw: unknown): Result<ProgramDetail, ProgramsError> => {
  const parsed = CoreApiProgramDetailSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const d: CoreApiProgramDetail = parsed.data
  return ok({
    id: d.id,
    programNumber: d.programNumber,
    name: d.name,
    sigla: d.sigla,
    director: d.director ?? '',
    generalCharacteristics: d.generalCharacteristics ?? '',
    logoKey: d.logoKey,
    status: d.status,
    version: d.version,
  })
}

const listToModel = (raw: unknown): Result<ProgramListResponse, ProgramsError> => {
  const parsed = CoreApiProgramListSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const m = parsed.data.meta
  return ok({
    items: parsed.data.items.map(itemToModel),
    meta: { page: m.currentPage, limit: m.itemsPerPage, total: m.totalItems },
  })
}

const buildListQuery = (input: ListProgramsInput): string => {
  const p = new URLSearchParams()
  p.set('page', String(input.page))
  p.set('limit', String(input.limit))
  p.set('order', input.order)
  if (input.search !== undefined && input.search !== '') p.set('search', input.search)
  if (input.status !== undefined) p.set('status', input.status)
  return p.toString()
}

export const createCoreApiProgramsClient = (baseUrl: string): ProgramClient => {
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` })
  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/programs?${buildListQuery(input)}`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return listToModel(r.value)
    },
    create: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/programs`, {
        method: 'POST',
        body: input,
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = CoreApiProgramDetailSchema.safeParse(r.value)
      if (!parsed.success) return err('server')
      return ok({ id: parsed.data.id })
    },
    getById: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/programs/${id}`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    update: async (id, input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/programs/${id}`, {
        method: 'PUT',
        body: input,
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
  }
}
