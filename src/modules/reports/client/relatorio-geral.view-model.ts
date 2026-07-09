/**
 * ViewModel PURA do "Relatório Geral" (ADR-0009, §XI): um LEDGER unificado ACHATADO e PAGINADO — uma linha por
 * movimento (payable / receivable / cartão / contrato / apontamento). Expõe a fonte (front-first), a paginação
 * PURA (totalPages/pageSlice) e o build do CSV fiel (uma linha por movimento, nullable → campo vazio). ZERO
 * React/TanStack (o lint barra `react`/`@tanstack/react-*` em `*.view-model.ts`). Testável em node:test.
 *
 * O UI-state page/perPage mora na View (§XI) — aqui só as DERIVAÇÕES puras. Sem `throw` (§II). Dinheiro em
 * CENTAVOS inteiros (§IV). As datas vêm PRONTAS ("DD/MM/AAAA") do placeholder — a VM nunca faz `new Date`.
 */
import { RELATORIO_GERAL_PLACEHOLDER, type LedgerRow } from './data/relatorio-geral.placeholder.ts'

export type { LedgerRow } from './data/relatorio-geral.placeholder.ts'

/**
 * Fonte da tela (front-first): as linhas placeholder. Ponto ÚNICO pelo qual a View obtém os dados — mantém a
 * View sem tocar a `data/` (boundary client-ui ↛ client-data). Quando o core-api#114 nascer, esta função passa
 * a receber o DTO real (mesmo shape `LedgerRow`).
 */
export function loadRelatorioGeral(): readonly LedgerRow[] {
  return RELATORIO_GERAL_PLACEHOLDER
}

/** Total de lançamentos (contador do cabeçalho da tabela). */
export function total(rows: readonly LedgerRow[] = RELATORIO_GERAL_PLACEHOLDER): number {
  return rows.length
}

// ── Paginação (derivação PURA — o UI-state page/perPage mora na View, §XI) ──

/** Itens por página padrão (espelha uma das opções do BrandPaginator: 5/10/25). */
export const PER_PAGE_DEFAULT = 10

/** Total de páginas: `ceil(total / perPage)`, no mínimo 1 (lista vazia = 1 página vazia). */
export function totalPages(totalItems: number, perPage: number): number {
  if (perPage <= 0) return 1
  return Math.max(1, Math.ceil(totalItems / perPage))
}

/**
 * Fatia da página corrente (1-based). Clampa a página ao intervalo válido para nunca estourar os limites do
 * array (defensivo — a View já reseta a página ao trocar perPage). Sem `throw` (§II).
 */
export function pageSlice(rows: readonly LedgerRow[], page: number, perPage: number): readonly LedgerRow[] {
  if (perPage <= 0) return rows
  const pages = totalPages(rows.length, perPage)
  const clamped = Math.min(Math.max(1, page), pages)
  const start = (clamped - 1) * perPage
  return rows.slice(start, start + perPage)
}

// ── Formatação ──

const brlFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Centavos → "R$ 1.234,56". */
export function formatBRL(cents: number): string {
  return brlFmt.format(cents / 100)
}

// ── Modelo de COLUNAS (fonte ÚNICA: tabela + CSV + seletor de colunas) ──

/** Id de cada coluna do ledger (na ordem do legado). */
export type GeneralColumnId =
  | 'data'
  | 'vencimento'
  | 'tipo'
  | 'numeroContrato'
  | 'codigo'
  | 'parcela'
  | 'apontamento'
  | 'fornecedor'
  | 'financiador'
  | 'colaborador'
  | 'centroCusto'
  | 'categoria'
  | 'subcategoria'
  | 'pixBancario'
  | 'valor'

/** Papel visual da célula (dirige a classe na View): plana · opcional ("—" se null) · destaque · valor BRL. */
export type GeneralColumnKind = 'plain' | 'optional' | 'strong' | 'value'

export type GeneralColumnDef = Readonly<{ id: GeneralColumnId; kind: GeneralColumnKind }>

/** As 15 colunas na ORDEM do legado. Fonte única consumida pela tabela, pelo CSV e pelo seletor de colunas. */
export const GENERAL_COLUMNS: readonly GeneralColumnDef[] = [
  { id: 'data', kind: 'plain' },
  { id: 'vencimento', kind: 'optional' },
  { id: 'tipo', kind: 'strong' },
  { id: 'numeroContrato', kind: 'optional' },
  { id: 'codigo', kind: 'optional' },
  { id: 'parcela', kind: 'optional' },
  { id: 'apontamento', kind: 'optional' },
  { id: 'fornecedor', kind: 'optional' },
  { id: 'financiador', kind: 'optional' },
  { id: 'colaborador', kind: 'optional' },
  { id: 'centroCusto', kind: 'optional' },
  { id: 'categoria', kind: 'optional' },
  { id: 'subcategoria', kind: 'optional' },
  { id: 'pixBancario', kind: 'optional' },
  { id: 'valor', kind: 'value' },
]

/** Todos os ids na ordem do legado (seleção padrão do seletor = todas visíveis). */
export const ALL_GENERAL_COLUMN_IDS: readonly GeneralColumnId[] = GENERAL_COLUMNS.map((c) => c.id)

/**
 * Texto de EXIBIÇÃO de uma célula por coluna: `valor` vem formatado em BRL; as demais retornam o campo cru
 * (ou `null` = ausente → a View mostra "—"). `switch` exaustivo (§IV) — nova coluna quebra o compilador aqui.
 */
export function cellText(row: LedgerRow, id: GeneralColumnId): string | null {
  switch (id) {
    case 'data':
      return row.data
    case 'vencimento':
      return row.vencimento
    case 'tipo':
      return row.tipo
    case 'numeroContrato':
      return row.numeroContrato
    case 'codigo':
      return row.codigo
    case 'parcela':
      return row.parcela
    case 'apontamento':
      return row.apontamento
    case 'fornecedor':
      return row.fornecedor
    case 'financiador':
      return row.financiador
    case 'colaborador':
      return row.colaborador
    case 'centroCusto':
      return row.centroCusto
    case 'categoria':
      return row.categoria
    case 'subcategoria':
      return row.subcategoria
    case 'pixBancario':
      return row.pixBancario
    case 'valor':
      return formatBRL(row.valorCents)
  }
}

// ── Export CSV (client-side; header pt-BR fiel às colunas do legado) ──

/** Rótulo pt-BR de cada coluna no CSV (fiel ao legado). */
export const CSV_HEADER_BY_ID: Record<GeneralColumnId, string> = {
  data: 'Data',
  vencimento: 'Vencimento',
  tipo: 'Tipo',
  numeroContrato: 'Nº Contrato',
  codigo: 'Código',
  parcela: 'Parcela',
  apontamento: 'Apontamento',
  fornecedor: 'Fornecedor',
  financiador: 'Financiador',
  colaborador: 'Colaborador',
  centroCusto: 'Centro de Custo',
  categoria: 'Categoria',
  subcategoria: 'Subcategoria',
  pixBancario: 'PIX/Bancário',
  valor: 'Valor',
}

/** Cabeçalho pt-BR das 15 colunas (delimitado por ';'), na ordem do legado — usado quando o export é completo. */
export const CSV_HEADER = ALL_GENERAL_COLUMN_IDS.map((id) => CSV_HEADER_BY_ID[id]).join(';')

/**
 * Monta o CSV: cabeçalho + uma linha por movimento. Por padrão exporta as 15 colunas; passando `visibleIds`
 * (o seletor de colunas), o export segue O QUE ESTÁ NA TELA (WYSIWYG), na mesma ordem. Campos nullable ficam
 * VAZIOS (o "—" é só de exibição). Valor em BRL. Delimitado por ';', campos entre aspas. `\r\n`.
 */
export function buildCsv(
  rows: readonly LedgerRow[] = RELATORIO_GERAL_PLACEHOLDER,
  visibleIds: readonly GeneralColumnId[] = ALL_GENERAL_COLUMN_IDS,
): string {
  const ids = visibleIds.length > 0 ? visibleIds : ALL_GENERAL_COLUMN_IDS
  const lines: string[] = [ids.map((id) => CSV_HEADER_BY_ID[id]).join(';')]
  for (const r of rows) {
    lines.push(ids.map((id) => `"${cellText(r, id) ?? ''}"`).join(';'))
  }
  return lines.join('\r\n')
}
