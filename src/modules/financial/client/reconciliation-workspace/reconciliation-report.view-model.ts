/**
 * View-model do Relatório da Conciliação em PDF (#144, spec 132) — derivação PURA (§XI: sem React/@tanstack,
 * testável em node:test). A partir do read do período (#205, `AccountStatementPeriod`) monta as linhas no
 * modelo de extrato, os títulos de cada lote, os cartões de saldo e o rótulo do período. Datas por
 * string PRONTA (fatiada), NUNCA `new Date(string)` — evita "Invalid Date"/recuo de fuso. `formatAccountNumber`
 * deriva a identificação da conta COM NÚMERO (banco · Ag · C/C) para o cabeçalho impresso. Impressão via
 * `window.print()` no binding (bloco oculto no workspace) — sem rota/navegação (ADR-0009).
 */
import type {
  AccountStatementPeriod,
  ReconciliationAccount,
  ReconciliationStatus,
  StatementReconciledTitle,
  StatementTransaction,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import { centsToBRL, centsToReais } from '#modules/financial/client/data/money.ts'

import { formatBranch } from '#modules/financial/client/reconciliation-accounts/reconciliation-accounts.view-model.ts'
import {
  batchTitlesOf,
  formatDateBR,
  retentionAgencyTag,
  titlesTotalCents,
} from './reconciliation-workspace.view-model.ts'

// Re-export p/ a view (ui) formatar dinheiro sem importar de client/data (boundary §I).
export { centsToBRL }

const MATCH_DASH = '—'

// Status da linha → tag i18n (a view traduz; o núcleo fica i18n-agnóstico do texto).
export type ReportStatusTag = 'reconciled' | 'pending'
export const reportStatusTag = (status: ReconciliationStatus): ReportStatusTag =>
  status === 'Pending' ? 'pending' : 'reconciled'

/** Título de um lote, sob a transação (spec 132). `nameTag` = órgão do imposto retido (a view traduz). */
export type ReportBatchTitle = Readonly<{
  id: string
  documento: string
  name: string
  nameTag: string | null
  vencimento: string
  value: string
}>

export type ReportBatch = Readonly<{
  count: number
  titles: readonly ReportBatchTitle[]
  total: string
}>

/** Linha do relatório (tudo JÁ formatado). O detalhe de transação que não é lote fica no modal. */
export type ReportRow = Readonly<{
  id: string
  dateBR: string
  description: string
  isBatch: boolean
  inValue: string
  outValue: string
  balance: string
  statusTag: ReportStatusTag
  batch: ReportBatch | null
}>

/** Totalizadores: cartões em BRL; `in`/`out` sem símbolo para a faixa de totais, como as colunas (R$). */
export type ReportTotals = Readonly<{
  openingBRL: string
  closingBRL: string
  totalInBRL: string
  totalOutBRL: string
  totalIn: string
  totalOut: string
}>

export type ReconciliationReport = Readonly<{
  periodLabel: string
  companyName: string
  rows: readonly ReportRow[]
  totals: ReportTotals
  isEmpty: boolean
  // A coluna Entrada só aparece quando o período tem entrada.
  showIn: boolean
  hasBatch: boolean
  // Cada lote conta como uma movimentação: é uma única saída no banco.
  movementCount: number
}>

/** Rótulo do período: "DD/MM/AAAA a DD/MM/AAAA" (datas por string pronta). */
export const periodLabelBR = (from: string, to: string): string =>
  `${formatDateBR(from)} a ${formatDateBR(to)}`

/** Data da linha no padrão do extrato: "DD/MM/AA", fatiada da string pronta. */
const dateShortBR = (iso: string): string => {
  const [year = '', month = '', day = ''] = iso.slice(0, 10).split('-')
  return `${day}/${month}/${year.slice(-2)}`
}

/** Histórico bancário: o que o banco enviou (memo); senão o favorecido; senão travessão. */
const rowDescription = (tx: StatementTransaction): string => {
  const memo = tx.memo.trim()
  if (memo !== '') return memo
  const payee = tx.payeeName.trim()
  return payee !== '' ? payee : MATCH_DASH
}

const toBatchTitle = (title: StatementReconciledTitle): ReportBatchTitle => ({
  id: title.payableId,
  documento: title.documentNumber ?? MATCH_DASH,
  name: title.payeeName ?? MATCH_DASH,
  nameTag: retentionAgencyTag(title.retentionType),
  vencimento: title.dueDate !== null ? formatDateBR(title.dueDate) : MATCH_DASH,
  value: centsToReais(title.reconciledValueCents),
})

const toBatch = (tx: StatementTransaction): ReportBatch | null => {
  const titles = batchTitlesOf(tx)
  if (titles.length === 0) return null
  return {
    count: titles.length,
    titles: titles.map(toBatchTitle),
    total: centsToReais(titlesTotalCents(titles)),
  }
}

const toRow = (tx: StatementTransaction): ReportRow => ({
  id: tx.id,
  dateBR: dateShortBR(tx.date),
  description: rowDescription(tx),
  isBatch: batchTitlesOf(tx).length > 0,
  inValue: tx.movement === 'Credit' ? centsToReais(tx.valueCents) : MATCH_DASH,
  outValue: tx.movement === 'Debit' ? centsToReais(tx.valueCents) : MATCH_DASH,
  balance: centsToReais(tx.balanceAfterCents),
  statusTag: reportStatusTag(tx.reconciliationStatus),
  batch: toBatch(tx),
})

const totalsOf = (opening: string, closing: string, totalIn: string, totalOut: string): ReportTotals => ({
  openingBRL: centsToBRL(opening),
  closingBRL: centsToBRL(closing),
  totalInBRL: centsToBRL(totalIn),
  totalOutBRL: centsToBRL(totalOut),
  totalIn: centsToReais(totalIn),
  totalOut: centsToReais(totalOut),
})

/**
 * Monta o relatório a partir do período (#205) + intervalo. `period === null` (sem dados/carregando/não
 * resolvido) → relatório vazio. `isEmpty` cobre também o período resolvido SEM movimentos (a view mostra o
 * cabeçalho + cartões + "sem movimentos"). PURA.
 */
export const buildReconciliationReport = (
  period: AccountStatementPeriod | null,
  from: string,
  to: string,
): ReconciliationReport => {
  const label = periodLabelBR(from, to)
  if (period === null) {
    return {
      periodLabel: label,
      companyName: '',
      rows: [],
      totals: totalsOf('0', '0', '0', '0'),
      isEmpty: true,
      showIn: false,
      hasBatch: false,
      movementCount: 0,
    }
  }
  const rows = period.movements.map(toRow)
  return {
    periodLabel: label,
    companyName: period.companyName ?? '',
    rows,
    totals: totalsOf(
      period.openingBalanceCents,
      period.closingBalanceCents,
      period.totalInCents,
      period.totalOutCents,
    ),
    isEmpty: rows.length === 0,
    showIn: period.movements.some((tx) => tx.movement === 'Credit'),
    hasBatch: rows.some((row) => row.batch !== null),
    movementCount: rows.length,
  }
}

/** Data e hora de emissão: "DD/MM/AAAA HH:mm", no fuso de quem emite. `now` injetado → PURA. */
export const formatEmission = (now: Date): string => {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${String(now.getFullYear())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
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
    : `${account.bankName} · Ag. ${formatBranch(account.branch, account.branchDv)} · C/C ${account.accountNumber}-${account.accountDv}`
