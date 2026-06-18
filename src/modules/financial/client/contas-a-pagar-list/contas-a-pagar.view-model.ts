/**
 * Derivação PURA do grid de Contas a Pagar (§XI: lógica fora da view; sem React). Mapeia a lista REAL
 * (`DocumentListResponse`) → estado da tela (loading/empty/error/ready) + linhas + paginação. DTO
 * enriquecido pela 012/#47: Tipo/Documento/Fornecedor/Contrato/Forma/Vencimento/Bruto/Líquido/Status +
 * version. (Só `Emissão` segue gated — depende do detalhe, core-api#95.) Money via `data/money`.
 */
import type { Result } from '#shared/primitives/result.ts'
import { normalizeCnpj, maskCnpj as maskCnpjDoc, maskCpf as maskCpfDoc } from '#shared/document/cnpj.ts'
import { centsToBRL } from '#modules/financial/client/data/money.ts'
import { financialErrorTag } from '#modules/financial/client/data/helpers/financial-error-tag.ts'
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'
import type {
  DocumentListResponse,
  DocumentStatus,
  DocumentType,
  DocumentSummary,
  DocumentDetail,
  RetentionType,
  PaymentMethod,
} from '#modules/financial/client/data/model/document.model.ts'

// Re-export p/ as views (ui) tiparem sem importar de client/data (boundary §I).
export type {
  DocumentStatus,
  DocumentType,
  RetentionType,
} from '#modules/financial/client/data/model/document.model.ts'

// Resolve o nome do fornecedor a partir do `supplierRef` (o DTO da lista só traz o id). Vem do binding
// (mapa dos Fornecedores já carregados). Mantém a view-model pura/testável.
export type ResolveSupplier = (ref: string | null) => string

// Tipo do parceiro — pinta o avatar pela regra de cor (Fornecedor=azul · Colaborador=âmbar ·
// Financiador=verde · ACT=laranja). Resolver OPCIONAL (aditivo: sem ele, `supplierKind` = null).
export type PartnerKind = 'supplier' | 'collaborator' | 'financier' | 'act'
export type ResolveSupplierKind = (ref: string | null) => PartnerKind | null
// CNPJ do favorecido (sublinha da coluna Fornecedor, padrão do grid de Contratos). Resolver OPCIONAL.
export type ResolveSupplierDoc = (ref: string | null) => string | null
// Número do contrato a partir do `contractRef` (uuid). Resolver OPCIONAL (vem do contracts-map).
export type ResolveContract = (ref: string | null) => string | null

export type GridRow = Readonly<{
  id: string
  type: string
  documentNumber: string
  series: string | null // sublinha "série …" da coluna Documento (Figma); null = sem série
  supplier: string
  supplierKind: PartnerKind | null
  supplierDoc: string | null // CNPJ já mascarado (ex.: "37.364.305/0001-92") ou null
  contract: string // número do contrato vinculado ("0003/2026") ou "—"
  paymentMethod: PaymentMethod | null // forma de pagamento (a view traduz via i18n)
  emissao: string // data de emissão — GATED (não vem na lista; core-api#95) → "—" até o backend expor
  gross: string // valor bruto formatado (BRL) ou "—"
  grossCents: string | null // bruto em centavos p/ o somatório da seleção
  due: string
  dueIso: string | null // vencimento cru (YYYY-MM-DD) p/ o input editável inline; null = sem data
  net: string
  netCents: string | null // líquido em centavos p/ o somatório da seleção (formatação fica fora)
  version: number // optimistic lock — p/ ações inline (Mudar Status em massa)
  status: DocumentStatus
}>

/** Mascara CNPJ (14 alfanum. Serpro/2026) / CPF (11) p/ exibição; null se vazio, ou o original se tamanho ≠. */
export const maskCnpj = (doc: string | null): string | null => {
  if (doc === null) return null
  const normalized = normalizeCnpj(doc)
  if (normalized === '') return null
  if (normalized.length === 14) return maskCnpjDoc(doc)
  if (normalized.length === 11) return maskCpfDoc(doc)
  return doc
}

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

// Colunas (Figma 205-638), enriquecidas pela 012/#47: + Contrato, Forma de Pagamento, Emissão, Bruto.
// `Emissão` entra como coluna (placeholder "—") até o backend expô-la na lista (core-api#95).
export const COLUMNS = [
  { key: 'type', labelTag: 'financial.list.col.type', align: 'left' },
  { key: 'documentNumber', labelTag: 'financial.list.col.documentNumber', align: 'left' },
  { key: 'supplier', labelTag: 'financial.list.col.supplier', align: 'left' },
  { key: 'contract', labelTag: 'financial.list.col.contract', align: 'left' },
  { key: 'paymentMethod', labelTag: 'financial.list.col.paymentMethod', align: 'left' },
  { key: 'emissao', labelTag: 'financial.list.col.emissao', align: 'left' },
  { key: 'due', labelTag: 'financial.list.col.due', align: 'left' },
  { key: 'gross', labelTag: 'financial.list.col.gross', align: 'right' },
  { key: 'net', labelTag: 'financial.list.col.net', align: 'right' },
  { key: 'status', labelTag: 'financial.list.col.status', align: 'left' },
] as const

// Chips de status (Figma) — filtram a lista pelo `status` real do backend (Draft/Open/Approved → PT).
// `status: null` = "Todos" (sem filtro). `filterable: false` = estado que o backend ainda NÃO produz
// (Transmitido/Recusado/Pago/Conciliado, Fatia 1 só tem 3) → chip desabilitado (chrome honesto).
// Contador real só aparece no chip ATIVO (= total da consulta filtrada); a lista é paginada no servidor.
export const STATUS_CHIPS = [
  { key: 'todos', labelTag: 'financial.list.chip.todos', status: null, filterable: true },
  { key: 'rascunho', labelTag: 'financial.list.chip.rascunho', status: 'Rascunho', filterable: true },
  { key: 'aberto', labelTag: 'financial.list.chip.aberto', status: 'Aberto', filterable: true },
  { key: 'aprovado', labelTag: 'financial.list.chip.aprovado', status: 'Aprovado', filterable: true },
  {
    key: 'transmitido',
    labelTag: 'financial.list.chip.transmitido',
    status: 'Transmitido',
    filterable: false,
  },
  { key: 'recusado', labelTag: 'financial.list.chip.recusado', status: 'Recusado', filterable: false },
  { key: 'pago', labelTag: 'financial.list.chip.pago', status: 'Pago', filterable: false },
  { key: 'conciliado', labelTag: 'financial.list.chip.conciliado', status: 'Conciliado', filterable: false },
] as const satisfies readonly {
  key: string
  labelTag: string
  status: DocumentStatus | null
  filterable: boolean
}[]

// ── Filtros avançados ("Adicionar filtro", estilo do mock) ────────────────────
// Só as dimensões com filtro REAL no backend (server-side, combinam com os status chips): Vencimento
// (dueFrom/dueTo), Tipo (type) e Fornecedor (supplierRef). As demais do protótipo (Nº doc, CNPJ/CPF,
// Competência, Valor, Contrato, Programa) foram DESCARTADAS por ora — voltam quando o backend expor
// (core-api#164/#163) e o cliente exigir. `enabled` mantido p/ reintroduzir como chrome no futuro.
export type FilterDimId = 'vencimento' | 'tipo' | 'fornecedor'
export type FilterTypeTag = 'TEXTO' | 'PERÍODO' | 'VALOR' | 'LISTA' | 'BUSCA'
export type FilterDim = Readonly<{
  id: FilterDimId
  labelTag: string
  groupTag: string
  typeTag: FilterTypeTag
  enabled: boolean // true = filtra de verdade (server-side); false = chrome até o backend
}>

export const FILTER_DIMS: readonly FilterDim[] = [
  {
    id: 'vencimento',
    labelTag: 'financial.list.filter.dim.vencimento',
    groupTag: 'financial.list.filter.group.datas',
    typeTag: 'PERÍODO',
    enabled: true,
  },
  {
    id: 'tipo',
    labelTag: 'financial.list.filter.dim.tipo',
    groupTag: 'financial.list.filter.group.classificacao',
    typeTag: 'LISTA',
    enabled: true,
  },
  {
    id: 'fornecedor',
    labelTag: 'financial.list.filter.dim.fornecedor',
    groupTag: 'financial.list.filter.group.classificacao',
    typeTag: 'BUSCA',
    enabled: true,
  },
]

// Ordem dos grupos no menu (espelha o mock; só os grupos com dimensão ativa).
export const FILTER_GROUPS = [
  'financial.list.filter.group.datas',
  'financial.list.filter.group.classificacao',
] as const

// Tipos de documento p/ o filtro "Tipo" (LISTA). Espelha DocumentType do model.
export const DOCUMENT_TYPE_OPTIONS: readonly DocumentType[] = [
  'NFS-e',
  'DANFE',
  'RPA',
  'Fatura',
  'Boleto',
  'Recibo',
  'Imposto',
]

// Valores dos filtros avançados ativos (só os com backend). Vazio = sem filtro.
export type AdvancedFilters = Readonly<{
  vencimento?: Readonly<{ from?: string; to?: string }> // YYYY-MM-DD → dueFrom/dueTo
  tipo?: DocumentType
  fornecedor?: string // supplierRef (uuid)
}>

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
  resolveDoc?: ResolveSupplierDoc,
  resolveContract?: ResolveContract,
): GridRow => ({
  id: it.id,
  type: it.type ?? DASH,
  documentNumber: it.documentNumber ?? DASH,
  series: it.series !== null && it.series !== '' ? it.series : null,
  supplier: resolveSupplier(it.supplierRef),
  supplierKind: resolveKind?.(it.supplierRef) ?? null,
  supplierDoc: maskCnpj(resolveDoc?.(it.supplierRef) ?? null),
  contract: it.contractRef !== null ? (resolveContract?.(it.contractRef) ?? it.contractRef) : DASH,
  paymentMethod: it.paymentMethod,
  emissao: DASH, // GATED: a emissão só virá quando o backend expô-la na lista (core-api#95)
  gross: it.grossValueCents !== null && it.grossValueCents !== '' ? centsToBRL(it.grossValueCents) : DASH,
  grossCents: it.grossValueCents,
  due: it.dueDate !== null && it.dueDate !== '' ? formatDue(it.dueDate) : DASH,
  dueIso: it.dueDate !== null && it.dueDate !== '' ? it.dueDate : null,
  net: it.netValueCents !== null && it.netValueCents !== '' ? centsToBRL(it.netValueCents) : DASH,
  netCents: it.netValueCents,
  version: it.version,
  status: it.status,
})

// ── Ações de status em massa (Mudar Status) — PURO ────────────────────────────
// `approve`: só linhas em "Aberto" (Aberto→Aprovado). `reopen`: só "Aprovado" (Aprovado→Aberto, undo).
// Cada alvo leva o `version` da linha (optimistic lock). As demais transições não têm rota (chrome).
export type StatusTarget = Readonly<{ id: string; version: number }>
export type BulkStatusTargets = Readonly<{
  approve: readonly StatusTarget[]
  reopen: readonly StatusTarget[]
}>

export const bulkStatusTargets = (
  rows: readonly GridRow[],
  selected: ReadonlySet<string>,
): BulkStatusTargets => {
  const sel = rows.filter((r) => selected.has(r.id))
  const pick = (r: GridRow): StatusTarget => ({ id: r.id, version: r.version })
  return {
    approve: sel.filter((r) => r.status === 'Aberto').map(pick),
    reopen: sel.filter((r) => r.status === 'Aprovado').map(pick),
  }
}

/** Soma (BRL) de um campo de centavos das linhas selecionadas — PURA (Intl fica no `centsToBRL`). */
const sumSelectedCentsBRL = (
  rows: readonly GridRow[],
  selected: ReadonlySet<string>,
  pick: (r: GridRow) => string | null,
): string => {
  const total = rows.reduce((acc, r) => {
    const cents = pick(r)
    if (!selected.has(r.id) || cents === null || cents === '') return acc
    const n = Number(cents)
    return Number.isFinite(n) ? acc + n : acc
  }, 0)
  return centsToBRL(String(total))
}

/** Soma do LÍQUIDO das linhas selecionadas (BRL). */
export const sumSelectedNetBRL = (rows: readonly GridRow[], selected: ReadonlySet<string>): string =>
  sumSelectedCentsBRL(rows, selected, (r) => r.netCents)

/** Soma do BRUTO das linhas selecionadas (BRL). */
export const sumSelectedGrossBRL = (rows: readonly GridRow[], selected: ReadonlySet<string>): string =>
  sumSelectedCentsBRL(rows, selected, (r) => r.grossCents)

export const buildRows = (
  items: readonly DocumentSummary[],
  resolveSupplier: ResolveSupplier,
  resolveKind?: ResolveSupplierKind,
  resolveDoc?: ResolveSupplierDoc,
  resolveContract?: ResolveContract,
): readonly GridRow[] =>
  items.map((it) => toRow(it, resolveSupplier, resolveKind, resolveDoc, resolveContract))

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
  supplierDoc: string | null // CNPJ mascarado do favorecido (sublinha do Fornecedor no drawer)
  emissao: string // GATED — placeholder "—" até o detalhe expor a emissão (core-api#95)
  due: string
  gross: string
  net: string
  paymentMethod: PaymentMethod | null
  description: string
  retentions: readonly RetentionLine[]
  // Total das retenções (soma dos filhos), formatado em BRL. `null` quando não há retenção.
  // No drawer aparece numa linha única destacada em vermelho (mock): "− Retenções (IRRF, INSS, ISS)".
  retentionsTotal: string | null
  payables: readonly DetailPayableView[]
}>

/** Soma (centavos) dos títulos-filho de retenção → BRL formatado; `null` quando não há retenção. PURA. */
const sumRetentionsBRL = (payables: DocumentDetail['payables']): string | null => {
  const children = payables.filter((p) => p.kind === 'Child' && p.retentionType !== null)
  if (children.length === 0) return null
  const totalCents = children.reduce(
    (s, p) => s + Number.parseInt(p.valueCents !== '' ? p.valueCents : '0', 10),
    0,
  )
  return centsToBRL(String(totalCents))
}

/** DocumentDetail (GET /:id) → view do drawer. PURA. Resolve nome + CNPJ do fornecedor pelos resolvers. */
export const mapDocumentDetail = (
  d: DocumentDetail,
  resolveSupplier: ResolveSupplier,
  resolveDoc?: ResolveSupplierDoc,
): DocumentDetailView => ({
  id: d.id,
  type: d.type ?? DASH,
  documentNumber: d.documentNumber ?? DASH,
  status: d.status,
  supplier: resolveSupplier(d.supplierRef),
  supplierDoc: maskCnpj(resolveDoc?.(d.supplierRef) ?? null),
  emissao: DASH, // GATED: emissão não vem no detalhe ainda (core-api#95)
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
  retentionsTotal: sumRetentionsBRL(d.payables),
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
  resolveDoc?: ResolveSupplierDoc
  resolveContract?: ResolveContract
}): ListState => {
  const { isLoading, data, resolveSupplier, resolveKind, resolveDoc, resolveContract } = args
  if (isLoading || data === undefined) return { tag: 'loading' }
  if (!data.ok) return { tag: 'error', errorTag: financialErrorTag(data.error) }
  if (data.value.items.length === 0) return { tag: 'empty' }
  return {
    tag: 'ready',
    rows: buildRows(data.value.items, resolveSupplier, resolveKind, resolveDoc, resolveContract),
    page: pageInfo(data.value.page, data.value.pageSize, data.value.total),
  }
}
