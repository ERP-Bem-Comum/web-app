/**
 * ViewModel PURA do "Relatório Geral" (ADR-0009, §XI): um LEDGER unificado ACHATADO e PAGINADO (server-side,
 * #442) — uma linha por título a-pagar. Mapeia o DTO real (`GeneralReportRow`) para a linha de exibição
 * (`LedgerRow`, colunas fiéis ao legado), formata data (DD/MM/AAAA, SEM `Date`) e PIX/bancário, e monta o CSV
 * WYSIWYG. ZERO React/TanStack (o lint barra `react`/`@tanstack/react-*` em `*.view-model.ts`). node:test-ável.
 *
 * Paginação é SERVER-SIDE (o `total` vem da resposta; `totalPages` é só derivação p/ o paginador). Dinheiro em
 * CENTAVOS inteiros (§IV). Sem `throw` (§II). Colunas sem fonte no #442 (Data≡Vencimento, Parcela, Apontamento)
 * degradam honesto (data = vencimento; parcela/apontamento = null → "—").
 */
import type { GeneralReportRow } from './data/model/general-report.model.ts'

/**
 * Uma linha do ledger achatado (exibição). Colunas fiéis ao legado (PT). Campos opcionais nullable → a View
 * mostra "—" e o CSV deixa vazio. `valorCents` sempre presente (centavos).
 */
export type LedgerRow = Readonly<{
  data: string
  vencimento: string | null
  tipo: string
  numeroContrato: string | null
  codigo: string | null
  parcela: string | null
  apontamento: string | null
  fornecedor: string | null
  financiador: string | null
  colaborador: string | null
  centroCusto: string | null
  categoria: string | null
  subcategoria: string | null
  /** Forma de liquidação — "PIX · <chave>" ou "<banco> · Ag <ag> · Cc <conta>-<dv>" ou null. */
  pixBancario: string | null
  valorCents: number
}>

/** Rótulo do tipo do movimento — o #442 é payables-only (`a-pagar`). */
const TIPO_A_PAGAR = 'A pagar'

/** `YYYY-MM-DD` (aceita sufixo de hora) → `DD/MM/AAAA`. Malformado → a própria string (sem `Date`). */
export function formatIsoDateBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (m === null) return iso
  const [, year, month, day] = m
  if (year === undefined || month === undefined || day === undefined) return iso
  return `${day}/${month}/${year}`
}

/** Nomes dos 12 meses (1=Janeiro … 12=Dezembro) — o separador de mês do ledger sai daqui POR ÍNDICE. */
const MONTH_NAMES_PT: readonly string[] = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

/** Chave de MÊS de uma data "DD/MM/AAAA" → "MM/AAAA" (agrupa o ledger por mês). Malformada → a própria string. */
export function monthGroupKey(dataBR: string): string {
  const m = /^\d{2}\/(\d{2})\/(\d{4})/.exec(dataBR)
  return m === null ? dataBR : `${m[1] ?? ''}/${m[2] ?? ''}`
}

/** Rótulo do separador de mês: "DD/MM/AAAA" → "Janeiro / 2026". Nome por ÍNDICE (nunca `Date`). Malformada → a string. */
export function monthGroupLabel(dataBR: string): string {
  const m = /^\d{2}\/(\d{2})\/(\d{4})/.exec(dataBR)
  if (m === null) return dataBR
  const idx = Number(m[1]) - 1
  const name = MONTH_NAMES_PT[idx] ?? m[1] ?? ''
  return `${name} / ${m[2] ?? ''}`
}

/** PIX (chave) tem precedência sobre bancário; ambos null → null. */
export function formatPixBancario(row: GeneralReportRow): string | null {
  if (row.pixKey !== null) return `PIX · ${row.pixKey.key}`
  if (row.bankAccount !== null) {
    const b = row.bankAccount
    return `${b.bank} · Ag ${b.agency} · Cc ${b.accountNumber}-${b.checkDigit}`
  }
  return null
}

/**
 * Mapeia a linha REAL do #442 (`GeneralReportRow`) para a linha de exibição (`LedgerRow`). `data` = `vencimento`
 * (o #442 só devolve `dueDate`); `parcela`/`apontamento` = null (sem fonte no #442). Nomes preservam null → "—".
 */
export function ledgerRowFromGeneral(r: GeneralReportRow): LedgerRow {
  const venc = formatIsoDateBR(r.dueDate)
  return {
    data: venc,
    vencimento: venc,
    tipo: TIPO_A_PAGAR,
    numeroContrato: r.contractNumber,
    codigo: r.code,
    parcela: null,
    apontamento: null,
    fornecedor: r.supplierName,
    financiador: r.financierName,
    colaborador: r.collaboratorName,
    centroCusto: r.costCenterName,
    categoria: r.categoryName,
    subcategoria: r.subcategoryName,
    pixBancario: formatPixBancario(r),
    valorCents: r.valueCents,
  }
}

// ── Paginação (derivação PURA; a paginação real é do servidor — `total` vem da resposta) ──

/** Itens por página padrão (espelha uma das opções do BrandPaginator: 5/10/25). */
export const PER_PAGE_DEFAULT = 10

/** Total de páginas: `ceil(total / perPage)`, no mínimo 1 (lista vazia = 1 página vazia). */
export function totalPages(totalItems: number, perPage: number): number {
  if (perPage <= 0) return 1
  return Math.max(1, Math.ceil(totalItems / perPage))
}

// ── Formatação de valor ──

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

/**
 * As 15 colunas na ORDEM EXATA do legado (ERP-BACKEND `GeneralReportReturn`): Contrato → Tipo → Código →
 * Vencimento → Parcela → Apontamento → Fornecedor → Financiador → Colaborador → Centro de Custo → Categoria →
 * Subcategoria → PIX/Bancário → Data → Valor (o legado tinha `bancary`+`pix` separados → aqui unificados em
 * `pixBancario`; `valor` fecha a linha). Fonte única consumida pela tabela, pelo CSV e pelo seletor de colunas.
 */
export const GENERAL_COLUMNS: readonly GeneralColumnDef[] = [
  { id: 'numeroContrato', kind: 'optional' },
  { id: 'tipo', kind: 'strong' },
  { id: 'codigo', kind: 'optional' },
  { id: 'vencimento', kind: 'optional' },
  { id: 'parcela', kind: 'optional' },
  { id: 'apontamento', kind: 'optional' },
  { id: 'fornecedor', kind: 'optional' },
  { id: 'financiador', kind: 'optional' },
  { id: 'colaborador', kind: 'optional' },
  { id: 'centroCusto', kind: 'optional' },
  { id: 'categoria', kind: 'optional' },
  { id: 'subcategoria', kind: 'optional' },
  { id: 'pixBancario', kind: 'optional' },
  { id: 'data', kind: 'plain' },
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
 * Monta o CSV: cabeçalho + uma linha por movimento (as linhas CARREGADAS — a página corrente, já que a
 * paginação é server-side). `visibleIds` (o seletor de colunas) faz o export seguir O QUE ESTÁ NA TELA
 * (WYSIWYG). Campos nullable ficam VAZIOS (o "—" é só de exibição). Valor em BRL. Delimitado por ';', aspas.
 */
export function buildCsv(
  rows: readonly LedgerRow[],
  visibleIds: readonly GeneralColumnId[] = ALL_GENERAL_COLUMN_IDS,
): string {
  const ids = visibleIds.length > 0 ? visibleIds : ALL_GENERAL_COLUMN_IDS
  const lines: string[] = [ids.map((id) => CSV_HEADER_BY_ID[id]).join(';')]
  for (const r of rows) {
    lines.push(ids.map((id) => `"${cellText(r, id) ?? ''}"`).join(';'))
  }
  return lines.join('\r\n')
}
