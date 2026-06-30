/**
 * core-api-partners — BUSCA de parceiros para o combobox de contratos (ADR-0010).
 *
 * Consome o **agregador nativo** `GET /api/v1/partners` do core-api (entregue na dev, PR #20):
 * uma lista unificada dos 4 tipos (`supplier · financier · collaborator · act`), paginada e com
 * busca server-side. Substitui o antigo fan-out de 4 GETs do BFF — agora é UMA chamada. O agregador
 * exige as 4 permissões de leitura (`{supplier,financier,collaborator,act}:read`); faltando qualquer
 * uma, devolve 403 → `unauthorized` (mesma semântica do fan-out anterior). NUNCA lança
 * (errors-as-values). Server-only (adapters).
 *
 * Nota: o agregador devolve `{ type, id, name, document, active }` — sem `email`/`telephone` (que o
 * combobox não usa: o dropdown mostra `name · kind` e a seleção liga só `id`/`kind`).
 */
import * as z from 'zod'
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'

export type PartnerSearchKind = 'Supplier' | 'Financier' | 'Collaborator' | 'ACT'
export type PartnerSearchError = 'unauthorized' | 'connectivity' | 'server'

export type PartnerSearchItem = Readonly<{
  id: string
  name: string
  document?: string
  email?: string // não fornecido pelo agregador (mantido p/ compat do tipo — sempre undefined)
  telephone?: string // idem
  kind: 'Fornecedor' | 'Financiador' | 'Colaborador' | 'ACT'
}>

const AGGREGATE_TYPES = ['supplier', 'financier', 'collaborator', 'act'] as const
type AggregateType = (typeof AGGREGATE_TYPES)[number]

// Boundary (§VI): valida só os campos que a busca usa; `z.object` descarta extras (incl. `meta`).
const PartnersAggregateItemSchema = z.object({
  type: z.enum(AGGREGATE_TYPES),
  id: z.string().trim(),
  name: z.string().trim(),
  document: z.string().trim(),
  active: z.boolean(),
})
const PartnersAggregateResponseSchema = z.object({ items: z.array(PartnersAggregateItemSchema) })

type PartnersAggregateItem = z.infer<typeof PartnersAggregateItemSchema>

// Quantos itens pedir ao agregador para o autocomplete do combobox.
const SEARCH_LIMIT = 20

export const partnerKindToType = (kind: PartnerSearchKind): AggregateType => {
  const map: Record<PartnerSearchKind, AggregateType> = {
    Supplier: 'supplier',
    Financier: 'financier',
    Collaborator: 'collaborator',
    ACT: 'act',
  }
  return map[kind]
}

export const aggregateTypeToLabel = (type: AggregateType): PartnerSearchItem['kind'] => {
  const map: Record<AggregateType, PartnerSearchItem['kind']> = {
    supplier: 'Fornecedor',
    financier: 'Financiador',
    collaborator: 'Colaborador',
    act: 'ACT',
  }
  return map[type]
}

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

const toItem = (it: PartnersAggregateItem): PartnerSearchItem => ({
  id: it.id,
  name: it.name,
  document: it.document,
  kind: aggregateTypeToLabel(it.type),
})

/**
 * searchPartners — UMA chamada ao agregador. Se `kind` for dado, filtra por `type`; senão, devolve os
 * 4 tipos unificados. Env lido DENTRO da função (nunca em escopo de módulo). Drift de contrato no
 * agregador → `server` (sem fan-out para degradar, surfacer é mais correto que esconder atrás de vazio).
 */
export const searchPartners = async (
  query: string,
  token: string,
  kind?: PartnerSearchKind,
): Promise<Result<readonly PartnerSearchItem[], PartnerSearchError>> => {
  const base = coreApiBase(loadEnvOrThrow().CORE_API_URL, 'v1')
  const qs = new URLSearchParams({ page: '1', limit: String(SEARCH_LIMIT) })
  if (query !== '') qs.set('search', query)
  if (kind !== undefined) qs.set('type', partnerKindToType(kind))

  const res = await resultFetch<unknown>(`${base}/partners?${qs.toString()}`, { method: 'GET', token })
  if (isErr(res)) return err(mapHttpError(res.error))

  const parsed = PartnersAggregateResponseSchema.safeParse(res.value)
  if (!parsed.success) return err('server')
  return ok(parsed.data.items.map(toItem))
}
