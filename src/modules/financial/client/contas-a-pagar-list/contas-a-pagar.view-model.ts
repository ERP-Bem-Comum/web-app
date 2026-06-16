/**
 * Derivação PURA do grid de Contas a Pagar (§XI: lógica fora da view; sem React). Mapeia a lista REAL
 * da Fatia 2 (`DocumentListResponse`) → estado da tela (loading/empty/error/ready) + linhas + paginação.
 * DTO ainda fino (FIN-LIST-DTO #47): colunas Tipo/Documento/Fornecedor/Vencimento/Líquido/Status; as
 * ricas (Contrato/Forma Pag./Emissão/Bruto) ficam gated. Money via `data/money`; erro → tag i18n.
 */
import type { Result } from '#shared/primitives/result.ts'
import { centsToBRL } from '#modules/financial/client/data/money.ts'
import { financialErrorTag } from '#modules/financial/client/data/helpers/financial-error-tag.ts'
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'
import type {
  DocumentListResponse,
  DocumentStatus,
  DocumentSummary,
} from '#modules/financial/client/data/model/document.model.ts'

// Resolve o nome do fornecedor a partir do `supplierRef` (o DTO da lista só traz o id). Vem do binding
// (mapa dos Fornecedores já carregados). Mantém a view-model pura/testável.
export type ResolveSupplier = (ref: string | null) => string

export type GridRow = Readonly<{
  id: string
  type: string
  documentNumber: string
  supplier: string
  due: string
  net: string
  status: DocumentStatus
}>

export type PageInfo = Readonly<{
  page: number
  pageSize: number
  total: number
  rangeLabel: string // ex.: "1–12 de 47"
  hasPrev: boolean
  hasNext: boolean
}>

export type ListState =
  | Readonly<{ tag: 'loading' }>
  | Readonly<{ tag: 'error'; errorTag: string }>
  | Readonly<{ tag: 'empty' }>
  | Readonly<{ tag: 'ready'; rows: readonly GridRow[]; page: PageInfo }>

// Colunas do v1 (DTO fino). `labelTag` = i18n; `align` p/ valores monetários à direita.
export const COLUMNS = [
  { key: 'type', labelTag: 'financial.list.col.type', align: 'left' },
  { key: 'documentNumber', labelTag: 'financial.list.col.documentNumber', align: 'left' },
  { key: 'supplier', labelTag: 'financial.list.col.supplier', align: 'left' },
  { key: 'due', labelTag: 'financial.list.col.due', align: 'left' },
  { key: 'net', labelTag: 'financial.list.col.net', align: 'right' },
  { key: 'status', labelTag: 'financial.list.col.status', align: 'left' },
] as const

// Chips de status (Figma) — CHROME no v1: contador real só no "Todos" (= total); os por-aba dependem de
// agregação que o backend da Fatia 2 não faz.
export const STATUS_CHIPS = [
  { key: 'todos', labelTag: 'financial.list.chip.todos' },
  { key: 'rascunho', labelTag: 'financial.list.chip.rascunho' },
  { key: 'aberto', labelTag: 'financial.list.chip.aberto' },
  { key: 'aprovado', labelTag: 'financial.list.chip.aprovado' },
  { key: 'pago', labelTag: 'financial.list.chip.pago' },
] as const

const DASH = '—'

/** YYYY-MM-DD → DD/MM/YYYY (sem `Date` — evita recuo de fuso). */
const formatDue = (iso: string): string => {
  const p = iso.split('-')
  return p.length === 3 ? `${p[2] ?? ''}/${p[1] ?? ''}/${p[0] ?? ''}` : iso
}

const toRow = (it: DocumentSummary, resolveSupplier: ResolveSupplier): GridRow => ({
  id: it.id,
  type: it.type ?? DASH,
  documentNumber: it.documentNumber ?? DASH,
  supplier: resolveSupplier(it.supplierRef),
  due: it.dueDate !== null && it.dueDate !== '' ? formatDue(it.dueDate) : DASH,
  net: it.netValueCents !== null && it.netValueCents !== '' ? centsToBRL(it.netValueCents) : DASH,
  status: it.status,
})

export const buildRows = (
  items: readonly DocumentSummary[],
  resolveSupplier: ResolveSupplier,
): readonly GridRow[] => items.map((it) => toRow(it, resolveSupplier))

export const pageInfo = (page: number, pageSize: number, total: number): PageInfo => {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return {
    page,
    pageSize,
    total,
    rangeLabel: `${String(from)}–${String(to)} de ${String(total)}`,
    hasPrev: page > 1,
    hasNext: to < total,
  }
}

/** Deriva o estado da tela a partir do resultado da query (que devolve um `Result`). PURA. */
export const deriveListState = (args: {
  isLoading: boolean
  data: Result<DocumentListResponse, FinancialError> | undefined
  resolveSupplier: ResolveSupplier
}): ListState => {
  const { isLoading, data, resolveSupplier } = args
  if (isLoading || data === undefined) return { tag: 'loading' }
  if (!data.ok) return { tag: 'error', errorTag: financialErrorTag(data.error) }
  if (data.value.items.length === 0) return { tag: 'empty' }
  return {
    tag: 'ready',
    rows: buildRows(data.value.items, resolveSupplier),
    page: pageInfo(data.value.page, data.value.pageSize, data.value.total),
  }
}
