/**
 * Visões salvas (saved views) da listagem de Contas a Pagar — núcleo PURO (§XI / ADR-0009). Uma "visão"
 * é um snapshot NOMEADO da combinação de filtros da tela — preferência de UI, não server-state. Aqui só
 * mora a lógica agnóstica: capturar o snapshot, serializar/parsear com TOLERÂNCIA (entrada corrompida →
 * `[]`, nunca `throw` — §II erros são valores). O I/O (localStorage, `crypto.randomUUID`) e o React vivem
 * no binding (`contas-a-pagar-saved-views.binding.ts`). SEM `react`, SEM `@tanstack/*`, SEM `localStorage`.
 *
 * Escopo dos filtros salvos = só os que EXISTEM hoje no front (status + vencimento/emissão/tipo/fornecedor).
 * Os predicados do #164 (valorMin/max, contractRef, programRef, numDoc, cnpjCpf) ainda NÃO existem no front;
 * quando entrarem no `AdvancedFilters`, a visão salva os incorpora NATURALMENTE — o shape abaixo espelha o
 * `AdvancedFilters` da view-model principal, então basta o parse tolerante reconhecer os novos campos.
 */
import {
  DOCUMENT_TYPE_OPTIONS,
  RETENTION_TYPE_OPTIONS,
  type AdvancedFilters,
  type FilterDimId,
  type TipoFilter,
  type DocumentStatus,
} from './contas-a-pagar.view-model.ts'

// Uma visão salva = id + nome + snapshot de { status, dims, filters }. `id` é gerado no binding (I/O).
export type SavedView = Readonly<{
  id: string
  name: string
  status: DocumentStatus | null // chip de status ativo (null = "Todos")
  dims: readonly FilterDimId[] // dimensões de filtro avançado ativas (reconstroem o `activeSet`)
  filters: AdvancedFilters // valores dos filtros (vencimento/emissão/tipo/fornecedor)
}>

// Snapshot capturado da tela SEM o `id` (o binding carimba o id ao persistir). PURO.
export const captureView = (
  name: string,
  status: DocumentStatus | null,
  dims: readonly FilterDimId[],
  filters: AdvancedFilters,
): Omit<SavedView, 'id'> => ({
  name: name.trim(),
  status,
  dims: [...dims], // cópia defensiva (imutabilidade §VII)
  filters,
})

// ── Validação manual TOLERANTE (sem Zod — mínimo de deps §VIII) ────────────────
// Valores válidos de cada campo (runtime). Espelham as uniões da view-model principal / do model.
const STATUS_VALUES: ReadonlySet<string> = new Set<DocumentStatus>([
  'Rascunho',
  'Aberto',
  'Aprovado',
  'Transmitido',
  'Recusado',
  'Pago',
  'Conciliado',
])
const DIM_VALUES: ReadonlySet<string> = new Set<FilterDimId>(['vencimento', 'emissao', 'tipo', 'fornecedor'])
const TIPO_VALUES: ReadonlySet<string> = new Set<string>([
  ...DOCUMENT_TYPE_OPTIONS,
  ...RETENTION_TYPE_OPTIONS,
])

const asRecord = (v: unknown): Readonly<Record<string, unknown>> | null =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null

// Período { from?, to? } — só strings; vazio (nenhum lado válido) → `undefined` (filtro ausente). Só
// inclui as chaves presentes (não grava `to: undefined`), preservando o round-trip com o `AdvancedFilters`.
const parsePeriod = (v: unknown): Readonly<{ from?: string; to?: string }> | undefined => {
  const o = asRecord(v)
  if (o === null) return undefined
  const from = typeof o.from === 'string' && o.from !== '' ? o.from : undefined
  const to = typeof o.to === 'string' && o.to !== '' ? o.to : undefined
  if (from === undefined && to === undefined) return undefined
  const period: { from?: string; to?: string } = {}
  if (from !== undefined) period.from = from
  if (to !== undefined) period.to = to
  return period
}

// `AdvancedFilters` tolerante — descarta campos desconhecidos/malformados; nunca lança. Novos predicados
// (#164) entram aqui quando o `AdvancedFilters` crescer.
const parseFilters = (v: unknown): AdvancedFilters => {
  const o = asRecord(v)
  if (o === null) return {}
  const out: {
    vencimento?: Readonly<{ from?: string; to?: string }>
    emissao?: Readonly<{ from?: string; to?: string }>
    tipo?: TipoFilter
    fornecedor?: string
  } = {}
  const vencimento = parsePeriod(o.vencimento)
  if (vencimento !== undefined) out.vencimento = vencimento
  const emissao = parsePeriod(o.emissao)
  if (emissao !== undefined) out.emissao = emissao
  if (typeof o.tipo === 'string' && TIPO_VALUES.has(o.tipo)) out.tipo = o.tipo as TipoFilter
  if (typeof o.fornecedor === 'string' && o.fornecedor !== '') out.fornecedor = o.fornecedor
  return out
}

// Uma entrada — entrada inválida (sem id/nome, status desconhecido) → `null` (é descartada, não derruba
// a lista inteira). Status ausente/inválido é REJEITADO (uma visão sempre grava status: null ou válido).
const parseView = (v: unknown): SavedView | null => {
  const o = asRecord(v)
  if (o === null) return null
  if (typeof o.id !== 'string' || o.id === '') return null
  if (typeof o.name !== 'string') return null
  let status: DocumentStatus | null
  if (o.status === null) status = null
  else if (typeof o.status === 'string' && STATUS_VALUES.has(o.status)) status = o.status as DocumentStatus
  else return null
  const dims = Array.isArray(o.dims)
    ? o.dims.filter((d): d is FilterDimId => typeof d === 'string' && DIM_VALUES.has(d))
    : []
  return { id: o.id, name: o.name, status, dims, filters: parseFilters(o.filters) }
}

/** Serializa as visões para persistência (JSON). PURA. */
export const serializeViews = (views: readonly SavedView[]): string => JSON.stringify(views)

/**
 * Parse TOLERANTE (§II): JSON corrompido, shape inesperado ou `null` → `[]` (nunca lança). Entradas
 * individuais inválidas são descartadas; as válidas sobrevivem. Aceita o `raw` cru do localStorage.
 */
export const parseViews = (raw: string | null): readonly SavedView[] => {
  if (raw === null || raw === '') return []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return [] // JSON corrompido → sem visões (preferência de UI é descartável)
  }
  if (!Array.isArray(data)) return []
  const out: SavedView[] = []
  for (const item of data) {
    const view = parseView(item)
    if (view !== null) out.push(view)
  }
  return out
}
