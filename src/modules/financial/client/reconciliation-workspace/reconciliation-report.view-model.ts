/**
 * View-model do Relatório da Conciliação em PDF (#144) — derivação PURA (§XI: sem React/@tanstack, testável
 * em node:test). A partir do read do período (#205, `AccountStatementPeriod`) monta as linhas do relatório
 * (Data/Descrição/Valor/Saldo/Status), os 6 totalizadores formatados (BRL) e o rótulo do período. Datas por
 * string PRONTA (fatiada), NUNCA `new Date(string)` — evita "Invalid Date"/recuo de fuso. `formatAccountNumber`
 * deriva a identificação da conta COM NÚMERO (banco · Ag · C/C) para o cabeçalho impresso. Impressão via
 * `window.print()` no binding (bloco oculto no workspace) — sem rota/navegação (ADR-0009).
 */
import type {
  AccountStatementPeriod,
  Movement,
  ReconciliationAccount,
  ReconciliationStatus,
  StatementTransaction,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import { centsToBRL } from '#modules/financial/client/data/money.ts'

import { formatDateBR } from './reconciliation-workspace.view-model.ts'

// Re-export p/ a view (ui) formatar dinheiro sem importar de client/data (boundary §I).
export { centsToBRL }

const MATCH_DASH = '—'

// Status da linha → tag i18n (a view traduz; o núcleo fica i18n-agnóstico do texto).
export type ReportStatusTag = 'reconciled' | 'pending'
export const reportStatusTag = (status: ReconciliationStatus): ReportStatusTag =>
  status === 'Pending' ? 'pending' : 'reconciled'

/** Linha do relatório (tudo JÁ formatado; `movement` cru p/ a view colorir por dado, sem regra na UI). */
export type ReportRow = Readonly<{
  id: string
  dateBR: string
  description: string
  valueBRL: string
  balanceBRL: string
  movement: Movement
  statusTag: ReportStatusTag
}>

/** Os 6 totalizadores do cabeçalho (money JÁ em BRL; contadores inteiros). */
export type ReportTotals = Readonly<{
  openingBRL: string
  closingBRL: string
  totalInBRL: string
  totalOutBRL: string
  reconciledCount: number
  pendingCount: number
}>

export type ReconciliationReport = Readonly<{
  periodLabel: string
  rows: readonly ReportRow[]
  totals: ReportTotals
  isEmpty: boolean
}>

/** Rótulo do período: "DD/MM/AAAA – DD/MM/AAAA" (datas por string pronta). */
export const periodLabelBR = (from: string, to: string): string =>
  `${formatDateBR(from)} – ${formatDateBR(to)}`

/** Descrição da linha: favorecido; senão o memo; senão travessão (estado honesto). */
const rowDescription = (tx: StatementTransaction): string => {
  const payee = tx.payeeName.trim()
  if (payee !== '') return payee
  const memo = tx.memo.trim()
  return memo !== '' ? memo : MATCH_DASH
}

const toRow = (tx: StatementTransaction): ReportRow => ({
  id: tx.id,
  dateBR: formatDateBR(tx.date),
  description: rowDescription(tx),
  valueBRL: centsToBRL(tx.valueCents),
  balanceBRL: centsToBRL(tx.balanceAfterCents),
  movement: tx.movement,
  statusTag: reportStatusTag(tx.reconciliationStatus),
})

const EMPTY_TOTALS: ReportTotals = {
  openingBRL: centsToBRL(0),
  closingBRL: centsToBRL(0),
  totalInBRL: centsToBRL(0),
  totalOutBRL: centsToBRL(0),
  reconciledCount: 0,
  pendingCount: 0,
}

/**
 * Monta o relatório a partir do período (#205) + intervalo. `period === null` (sem dados/carregando/não
 * resolvido) → relatório vazio (totalizadores zerados). `isEmpty` cobre também o período resolvido SEM
 * movimentos (a view mostra o cabeçalho + totalizadores + "sem movimentos"). PURA.
 */
export const buildReconciliationReport = (
  period: AccountStatementPeriod | null,
  from: string,
  to: string,
): ReconciliationReport => {
  const label = periodLabelBR(from, to)
  if (period === null) {
    return { periodLabel: label, rows: [], totals: EMPTY_TOTALS, isEmpty: true }
  }
  const rows = period.movements.map(toRow)
  return {
    periodLabel: label,
    rows,
    totals: {
      openingBRL: centsToBRL(period.openingBalanceCents),
      closingBRL: centsToBRL(period.closingBalanceCents),
      totalInBRL: centsToBRL(period.totalInCents),
      totalOutBRL: centsToBRL(period.totalOutCents),
      reconciledCount: period.counters.reconciled,
      pendingCount: period.counters.pending,
    },
    isEmpty: rows.length === 0,
  }
}

/** Estado da tela do relatório (união discriminada; a view faz `switch`). */
export type ReportViewState =
  | Readonly<{ tag: 'no-period' }>
  | Readonly<{ tag: 'loading' }>
  | Readonly<{ tag: 'error'; errorTag: string }>
  | Readonly<{ tag: 'ready'; report: ReconciliationReport }>

/**
 * Identificação da conta COM NÚMERO para o cabeçalho impresso: "{bankName} · Ag. {branch} · C/C
 * {accountNumber}-{accountDv}". Sem conta resolvida (core-api#168 pendente) → string vazia (a view omite a
 * linha — chrome honesto, sem inventar número). PURA (node:test-ável).
 */
export const formatAccountNumber = (account: ReconciliationAccount | null): string =>
  account === null
    ? ''
    : `${account.bankName} · Ag. ${account.branch} · C/C ${account.accountNumber}-${account.accountDv}`
