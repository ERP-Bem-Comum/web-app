/**
 * core-api-partners-aggregate — agregador `GET /api/v1/partners` do core-api (ADR-0027): UMA lista
 * unificada dos 4 tipos (`supplier · financier · collaborator · act`), com `document` já normalizado por
 * tipo (CPF p/ colaborador PF, CNPJ p/ PJ). Pagina internamente (limit 100) para devolver TODOS os
 * parceiros — usado pelo BFF do financeiro p/ resolver o favorecido (picker + grid). Mesma fonte que o
 * combobox de Contratos usa. Exige as 4 permissões de leitura; faltando uma → 403 → `unauthorized`.
 * NUNCA lança (errors-as-values). Server-only (adapters).
 */
import * as z from 'zod'

import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'

export type PartnerAggregateKind = 'supplier' | 'financier' | 'collaborator' | 'act'
export type PartnerAggregateError = 'unauthorized' | 'connectivity' | 'server'

export type PartnerAggregateItem = Readonly<{
  id: string
  name: string
  document: string // CPF (colaborador, PF) ou CNPJ (fornecedor/financiador/ato, PJ)
  kind: PartnerAggregateKind
  active: boolean
}>

const AGGREGATE_TYPES = ['supplier', 'financier', 'collaborator', 'act'] as const

// Boundary (§VI): valida só o que o financeiro usa; `z.object` descarta extras (ex.: contractCount).
const PartnerAggregateItemSchema = z.object({
  type: z.enum(AGGREGATE_TYPES),
  id: z.string().trim(),
  name: z.string().trim(),
  document: z.string().trim(),
  active: z.boolean(),
})
const PartnersAggregateMetaSchema = z.object({
  totalPages: z.int().nonnegative(),
  currentPage: z.int(),
})
const PartnersAggregateResponseSchema = z.object({
  items: z.array(PartnerAggregateItemSchema),
  meta: PartnersAggregateMetaSchema,
})

const PAGE_LIMIT = 100

const mapHttpError = (e: HttpError): PartnerAggregateError => {
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

/**
 * listAllPartners — TODOS os parceiros (ativos e inativos) dos 4 tipos, paginando até esgotar. Env lido
 * DENTRO da função (nunca em escopo de módulo). Drift de contrato → `server`.
 */
export const listAllPartners = async (
  token: string,
): Promise<Result<readonly PartnerAggregateItem[], PartnerAggregateError>> => {
  const base = coreApiBase(loadEnvOrThrow().CORE_API_URL, 'v1')
  const out: PartnerAggregateItem[] = []
  let page = 1
  for (;;) {
    const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) })
    const res = await resultFetch<unknown>(`${base}/partners?${qs.toString()}`, { method: 'GET', token })
    if (isErr(res)) return err(mapHttpError(res.error))

    const parsed = PartnersAggregateResponseSchema.safeParse(res.value)
    if (!parsed.success) return err('server')

    for (const it of parsed.data.items) {
      out.push({ id: it.id, name: it.name, document: it.document, kind: it.type, active: it.active })
    }
    const { currentPage, totalPages } = parsed.data.meta
    if (parsed.data.items.length === 0 || currentPage >= totalPages) break
    page += 1
  }
  return ok(out)
}
