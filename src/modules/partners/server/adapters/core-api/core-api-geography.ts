/**
 * Cliente HTTP do core-api para geografia de parceria — `/api/v1/partner-states` e
 * `/api/v1/partner-municipalities`. NUNCA lança (tudo é Result). Server-only (adapters). Os toggles são
 * idempotentes e DEVOLVEM o DTO do item (200) — parseamos a resposta (sem refetch). `isPartner` decide o
 * método: true → POST (ativar), false → DELETE (desativar). Shape confirmado contra `partner-geography-schemas.ts`.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type { GeographyClient } from '#modules/partners/server/application/geography/geography.use-cases.ts'
import type { PartnerState, PartnerMunicipality } from '#modules/partners/server/domain/geography/geography.types.ts'
import {
  CoreApiPartnerStateSchema,
  CoreApiPartnerStateListSchema,
  CoreApiPartnerMunicipalitySchema,
  CoreApiPartnerMunicipalityListSchema,
  CoreApiAddedMunicipalitiesPagedSchema,
} from './geography.schema.ts'
import { toAddedMunicipalities, type AddedMunicipalityDto } from './added-municipalities.mapper.ts'

const SLUG_TO_ERROR: Partial<Record<string, PartnersError>> = {
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  'invalid-state': 'invalid-state',
  'invalid-ibge-code': 'invalid-ibge-code',
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

export const createCoreApiGeographyClient = (baseUrl: string): GeographyClient => {
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

  return {
    listPartnerStates: async (token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/partner-states`, { method: 'GET', headers: auth(token) })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = CoreApiPartnerStateListSchema.safeParse(r.value)
      return parsed.success ? ok(parsed.data) : err('server')
    },

    setPartnerState: async (uf, isPartner, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/partner-states/${uf}`, {
        method: isPartner ? 'POST' : 'DELETE',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = CoreApiPartnerStateSchema.safeParse(r.value)
      return parsed.success ? ok(parsed.data satisfies PartnerState) : err('server')
    },

    listMunicipalitiesByUf: async (uf, token) => {
      const qs = new URLSearchParams({ uf }).toString()
      const r = await resultFetch<unknown>(`${baseUrl}/partner-municipalities?${qs}`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = CoreApiPartnerMunicipalityListSchema.safeParse(r.value)
      return parsed.success ? ok(parsed.data) : err('server')
    },

    setPartnerMunicipality: async (ibgeCode, isPartner, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/partner-municipalities/${ibgeCode}`, {
        method: isPartner ? 'POST' : 'DELETE',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = CoreApiPartnerMunicipalitySchema.safeParse(r.value)
      return parsed.success ? ok(parsed.data satisfies PartnerMunicipality) : err('server')
    },

    // GET /partner-municipalities/added (cross-state, PAGINADO). Acumula TODAS as páginas (limit=100,
    // até currentPage >= totalPages; guard de MAX_PAGES) e mapeia para o domínio. Recursão imutável
    // (sem mutar arrays) — borda sem throw (tudo Result).
    listAddedMunicipalities: async (token) => {
      const PER_PAGE = 100
      const MAX_PAGES = 50
      const fetchPage = async (
        page: number,
        soFar: readonly AddedMunicipalityDto[],
      ): Promise<Result<readonly AddedMunicipalityDto[], PartnersError>> => {
        const qs = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) }).toString()
        const r = await resultFetch<unknown>(`${baseUrl}/partner-municipalities/added?${qs}`, {
          method: 'GET',
          headers: auth(token),
        })
        if (isErr(r)) return err(mapHttpError(r.error))
        const parsed = CoreApiAddedMunicipalitiesPagedSchema.safeParse(r.value)
        if (!parsed.success) return err('server')
        const merged = [...soFar, ...parsed.data.items]
        const { currentPage, totalPages } = parsed.data.meta
        if (currentPage >= totalPages || page >= MAX_PAGES) return ok(merged)
        return fetchPage(page + 1, merged)
      }
      const collected = await fetchPage(1, [])
      return isErr(collected) ? collected : ok(toAddedMunicipalities(collected.value))
    },
  }
}
