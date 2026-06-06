/**
 * core-api-partners — orquestrador de BUSCA de parceiros para o combobox de contratos (ADR-0010).
 *
 * O core-api NÃO tem rota agregadora `/api/v1/partners`: cada tipo é um recurso isolado
 * (`suppliers` · `financiers` · `acts` · `collaborators`, todos em `/api/v1`). O BFF faz o **fan-out**
 * dos endpoints em paralelo, normaliza para um item unificado e devolve UMA lista — o client nunca
 * sabe que foram N chamadas. NUNCA lança (errors-as-values). Server-only (adapters).
 */
import * as z from 'zod'
import { ok, err, isErr, isOk, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import { loadEnvOrThrow } from '#external/config/env.config.ts'

export type PartnerSearchKind = 'Supplier' | 'Financier' | 'Collaborator' | 'ACT'
export type PartnerSearchError = 'unauthorized' | 'connectivity' | 'server'

export type PartnerSearchItem = Readonly<{
  id: string
  name: string
  document?: string
  email?: string
  telephone?: string
  kind: 'Fornecedor' | 'Financiador' | 'Colaborador' | 'ACT'
}>

// Boundary (§VI): valida só os campos que a busca usa; `z.object` descarta extras (sem `.loose()` —
// não vaza PII não validada, ver collaborator.schema.ts). Cada recurso pode nomear o documento
// diferente (cnpj/cpf/document) — aceitamos os três e normalizamos.
const CoreApiPartnerItemSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  cnpj: z.string().trim().optional(),
  cpf: z.string().trim().optional(),
  document: z.string().trim().optional(),
  email: z.string().trim().optional(),
  telephone: z.string().trim().optional(),
  phone: z.string().trim().optional(),
})
const CoreApiPartnerListSchema = z.object({ items: z.array(CoreApiPartnerItemSchema) })

type CoreApiPartnerItem = z.infer<typeof CoreApiPartnerItemSchema>

type Resource = Readonly<{ kind: PartnerSearchKind; path: string; label: PartnerSearchItem['kind'] }>
const RESOURCES: readonly Resource[] = [
  { kind: 'Supplier', path: 'suppliers', label: 'Fornecedor' },
  { kind: 'Financier', path: 'financiers', label: 'Financiador' },
  { kind: 'Collaborator', path: 'collaborators', label: 'Colaborador' },
  { kind: 'ACT', path: 'acts', label: 'ACT' },
]

// CORE_API_URL inclui o prefixo /api/v2 (auth/contracts); parceiros vivem em /api/v1 (ADR-0033).
const derivePartnersBase = (coreApiUrl: string): string =>
  coreApiUrl.includes('/api/v2')
    ? coreApiUrl.replace('/api/v2', '/api/v1')
    : `${coreApiUrl.replace(/\/+$/, '')}/api/v1`

const mapHttpError = (e: HttpError): PartnerSearchError => {
  switch (e.kind) {
    case 'http':
      return e.status === 401 || e.status === 403 ? 'unauthorized' : 'server'
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

const toItem = (it: CoreApiPartnerItem, label: PartnerSearchItem['kind']): PartnerSearchItem => ({
  id: it.id,
  name: it.name,
  document: it.cnpj ?? it.cpf ?? it.document,
  email: it.email,
  telephone: it.telephone ?? it.phone,
  kind: label,
})

const fetchResource = async (
  base: string,
  r: Resource,
  query: string,
  token: string,
): Promise<Result<readonly PartnerSearchItem[], PartnerSearchError>> => {
  const qs = new URLSearchParams({ limit: '10' })
  if (query !== '') qs.set('search', query)
  const res = await resultFetch<unknown>(`${base}/${r.path}?${qs.toString()}`, { method: 'GET', token })
  if (isErr(res)) return err(mapHttpError(res.error))
  const parsed = CoreApiPartnerListSchema.safeParse(res.value)
  // Drift de contrato NESTE recurso não derruba a busca inteira — degrada para vazio.
  if (!parsed.success) return ok([])
  return ok(parsed.data.items.map((it) => toItem(it, r.label)))
}

/**
 * searchPartners — fan-out + merge. Se `kind` for dado, consulta só aquele recurso; senão, os 4 em
 * paralelo. Falha de auth em qualquer recurso propaga como `unauthorized`; demais falhas degradam para
 * vazio (busca resiliente). Env lido DENTRO da função (nunca em escopo de módulo).
 */
export const searchPartners = async (
  query: string,
  token: string,
  kind?: PartnerSearchKind,
): Promise<Result<readonly PartnerSearchItem[], PartnerSearchError>> => {
  const base = derivePartnersBase(loadEnvOrThrow().CORE_API_URL)
  const targets = kind === undefined ? RESOURCES : RESOURCES.filter((r) => r.kind === kind)
  const results = await Promise.all(targets.map((r) => fetchResource(base, r, query, token)))
  if (results.some((r) => isErr(r) && r.error === 'unauthorized')) return err('unauthorized')
  return ok(results.flatMap((r) => (isOk(r) ? r.value : [])))
}
