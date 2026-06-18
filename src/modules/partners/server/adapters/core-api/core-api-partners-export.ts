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

/** Nome de arquivo de fallback do histórico de um colaborador (espelha o Content-Disposition do core-api). */
export const collaboratorHistoryFilename = (id: string): string => `collaborator-${id}-history.csv`

/**
 * Extrai o `filename` de um header `Content-Disposition` (suporta `filename="..."` e `filename*=UTF-8''...`).
 * Retorna `undefined` se não houver um nome utilizável — o chamador aplica seu próprio fallback.
 */
export const parseContentDispositionFilename = (header: string | null): string | undefined => {
  if (header === null) return undefined
  const star = /filename\*\s*=\s*(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(header)
  if (star?.[1] !== undefined && star[1] !== '') {
    try {
      return decodeURIComponent(star[1])
    } catch {
      return star[1]
    }
  }
  const plain = /filename\s*=\s*["']?([^"';]+)["']?/i.exec(header)
  return plain?.[1] !== undefined && plain[1] !== '' ? plain[1] : undefined
}

/**
 * Export do HISTÓRICO de alterações de um colaborador — `GET /collaborators/:id/export?type=history`
 * (`type` é literal obrigatório). Passthrough do `text/csv`; histórico vazio = CSV só com cabeçalho
 * (sucesso, não erro). Preserva o `filename` do `Content-Disposition` (fallback `collaborator-<id>-history.csv`).
 * 503 (reader indisponível) cai em `server`. NÃO usa `resultFetch` (que força JSON). NUNCA lança. Server-only.
 */
export const exportCollaboratorHistoryCsv = async (
  baseUrl: string,
  id: string,
  token: string,
): Promise<Result<PartnerExportFile, PartnersError>> => {
  let response: Response
  try {
    response = await globalThis.fetch(`${baseUrl}/collaborators/${id}/export?type=history`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv' },
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    return err('connectivity')
  }
  if (!response.ok) return err(await mapResponseError(response))
  const csv = await response.text().catch(() => '')
  const filename =
    parseContentDispositionFilename(response.headers.get('content-disposition')) ??
    collaboratorHistoryFilename(id)
  return ok({ filename, csv })
}
