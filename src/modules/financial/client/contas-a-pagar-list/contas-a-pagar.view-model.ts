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
  DocumentDetail,
  RetentionType,
  PaymentMethod,
} from '#modules/financial/client/data/model/document.model.ts'

// Re-export p/ as views (ui) tiparem sem importar de client/data (boundary §I).
export type { DocumentStatus, RetentionType } from '#modules/financial/client/data/model/document.model.ts'

// Resolve o nome do fornecedor a partir do `supplierRef` (o DTO da lista só traz o id). Vem do binding
// (mapa dos Fornecedores já carregados). Mantém a view-model pura/testável.
export type ResolveSupplier = (ref: string | null) => string

// Tipo do parceiro — pinta o avatar pela regra de cor (Fornecedor=azul · Colaborador=âmbar ·
// Financiador=verde · ACT=laranja). Resolver OPCIONAL (aditivo: sem ele, `supplierKind` = null).
export type PartnerKind = 'supplier' | 'collaborator' | 'financier' | 'act'
export type ResolveSupplierKind = (ref: string | null) => PartnerKind | null

export type GridRow = Readonly<{
  id: string
  type: string
  documentNumber: string
  supplier: string
  supplierKind: PartnerKind | null
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
  { key: 'transmitido', labelTag: 'financial.list.chip.transmitido' },
  { key: 'recusado', labelTag: 'financial.list.chip.recusado' },
  { key: 'pago', labelTag: 'financial.list.chip.pago' },
  { key: 'conciliado', labelTag: 'financial.list.chip.conciliado' },
] as const

const DASH = '—'

/** YYYY-MM-DD → DD/MM/YYYY (sem `Date` — evita recuo de fuso). */
const formatDue = (iso: string): string => {
  const p = iso.split('-')
  return p.length === 3 ? `${p[2] ?? ''}/${p[1] ?? ''}/${p[0] ?? ''}` : iso
}

const toRow = (
  it: DocumentSummary,
  resolveSupplier: ResolveSupplier,
  resolveKind?: ResolveSupplierKind,
): GridRow => ({
  id: it.id,
  type: it.type ?? DASH,
  documentNumber: it.documentNumber ?? DASH,
  supplier: resolveSupplier(it.supplierRef),
  supplierKind: resolveKind?.(it.supplierRef) ?? null,
  due: it.dueDate !== null && it.dueDate !== '' ? formatDue(it.dueDate) : DASH,
  net: it.netValueCents !== null && it.netValueCents !== '' ? centsToBRL(it.netValueCents) : DASH,
  status: it.status,
})

export const buildRows = (
  items: readonly DocumentSummary[],
  resolveSupplier: ResolveSupplier,
  resolveKind?: ResolveSupplierKind,
): readonly GridRow[] => items.map((it) => toRow(it, resolveSupplier, resolveKind))

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

// ── Detalhe do documento (drawer — onda 2) ────────────────────────────────────
export type RetentionLine = Readonly<{ type: RetentionType; value: string }>
export type DetailPayableView = Readonly<{
  id: string
  isParent: boolean
  retentionType: RetentionType | null
  value: string
  status: DocumentStatus
}>
export type DocumentDetailView = Readonly<{
  id: string
  type: string
  documentNumber: string
  status: DocumentStatus
  supplier: string
  due: string
  gross: string
  net: string
  paymentMethod: PaymentMethod | null
  description: string
  retentions: readonly RetentionLine[]
  payables: readonly DetailPayableView[]
}>

/** DocumentDetail (GET /:id) → view do drawer. PURA. Resolve o nome do fornecedor pelo `resolveSupplier`. */
export const mapDocumentDetail = (
  d: DocumentDetail,
  resolveSupplier: ResolveSupplier,
): DocumentDetailView => ({
  id: d.id,
  type: d.type ?? DASH,
  documentNumber: d.documentNumber ?? DASH,
  status: d.status,
  supplier: resolveSupplier(d.supplierRef),
  due: d.dueDate !== null && d.dueDate !== '' ? formatDue(d.dueDate) : DASH,
  gross: d.grossValueCents !== null && d.grossValueCents !== '' ? centsToBRL(d.grossValueCents) : DASH,
  net: d.netValueCents !== null && d.netValueCents !== '' ? centsToBRL(d.netValueCents) : DASH,
  paymentMethod: d.paymentMethod,
  description: d.description ?? '',
  retentions: d.payables.flatMap((p) =>
    p.kind === 'Child' && p.retentionType !== null
      ? [{ type: p.retentionType, value: centsToBRL(p.valueCents) }]
      : [],
  ),
  payables: d.payables.map((p) => ({
    id: p.id,
    isParent: p.kind === 'Parent',
    retentionType: p.retentionType,
    value: centsToBRL(p.valueCents),
    status: p.status,
  })),
})

// ── Exportar (client-side, padrão Contratos) ──────────────────────────────────
const CSV_HEADERS = ['Tipo', 'Documento', 'Fornecedor', 'Vencimento', 'Líquido', 'Status'] as const

/** Monta o CSV (`;`) das linhas exibidas — PURO. Escapa aspas (RFC 4180). */
export const buildDocumentsCsv = (rows: readonly GridRow[]): string => {
  const cell = (v: string): string => `"${v.replace(/"/g, '""')}"`
  const lines = rows.map((r) =>
    [r.type, r.documentNumber, r.supplier, r.due, r.net, r.status].map(cell).join(';'),
  )
  return [CSV_HEADERS.join(';'), ...lines].join('\n')
}

/** Carimbo YYYY-MM-DD p/ o nome do arquivo. O relógio mora na view-model (não na view — §XI). */
export const exportFileStamp = (): string => new Date().toISOString().slice(0, 10)

/** Deriva o estado da tela a partir do resultado da query (que devolve um `Result`). PURA. */
export const deriveListState = (args: {
  isLoading: boolean
  data: Result<DocumentListResponse, FinancialError> | undefined
  resolveSupplier: ResolveSupplier
  resolveKind?: ResolveSupplierKind
}): ListState => {
  const { isLoading, data, resolveSupplier, resolveKind } = args
  if (isLoading || data === undefined) return { tag: 'loading' }
  if (!data.ok) return { tag: 'error', errorTag: financialErrorTag(data.error) }
  if (data.value.items.length === 0) return { tag: 'empty' }
  return {
    tag: 'ready',
    rows: buildRows(data.value.items, resolveSupplier, resolveKind),
    page: pageInfo(data.value.page, data.value.pageSize, data.value.total),
  }
}
