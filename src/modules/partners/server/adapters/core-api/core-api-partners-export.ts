/**
 * Export CSV de parceiros — passthrough do `text/csv` que o core-api serializa em
 * `GET /api/v1/{resource}/export` (suppliers/collaborators/financiers/acts; paridade na PR #20). O BFF
 * autentica e repassa o corpo cru; o client dispara o download. NÃO usa `resultFetch` (que força JSON):
 * lê o corpo como texto via `fetch` nativo. NUNCA lança (tudo é Result). Server-only (adapters).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type PartnerExportResource = 'collaborators' | 'suppliers' | 'financiers' | 'acts'

export type PartnerExportQuery = Readonly<{
  search?: string
  active?: boolean
  categories?: readonly string[] // só suppliers; ignorado pelos demais recursos
}>

export type PartnerExportFile = Readonly<{ filename: string; csv: string }>

const SLUG_TO_ERROR: Partial<Record<string, PartnersError>> = {
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
}

const statusToError = (status: number, slug: string | undefined): PartnersError => {
  const bySlug = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
  if (bySlug !== undefined) return bySlug
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  return 'server'
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

export const partnerExportFilename = (resource: PartnerExportResource): string => `${resource}.csv`

export const buildExportQuery = (q: PartnerExportQuery): string => {
  const p = new URLSearchParams()
  if (q.search !== undefined && q.search !== '') p.set('search', q.search)
  if (q.active !== undefined) p.set('active', q.active ? '1' : '0')
  for (const c of q.categories ?? []) p.append('categories', c)
  return p.toString()
}

export const exportPartnerCsv = async (
  baseUrl: string,
  resource: PartnerExportResource,
  query: PartnerExportQuery,
  token: string,
): Promise<Result<PartnerExportFile, PartnersError>> => {
  const qs = buildExportQuery(query)
  let response: Response
  try {
    response = await globalThis.fetch(`${baseUrl}/${resource}/export${qs === '' ? '' : `?${qs}`}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv' },
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    return err('connectivity')
  }
  if (!response.ok) return err(await mapResponseError(response))
  const csv = await response.text().catch(() => '')
  return ok({ filename: partnerExportFilename(resource), csv })
}
