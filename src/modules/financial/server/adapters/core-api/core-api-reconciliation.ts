/**
 * Cliente HTTP do core-api para a Conciliação Bancária — chama `/api/v2/financial/...` (PR #152). NUNCA
 * lança (tudo é Result; `throw` só na borda do `resultFetch`). Server-only (adapters). Anti-corruption:
 * delega a tradução aos mappers PUROS (`reconciliation.mappers.ts`) e o erro a `mapHttpError`. Espelha
 * `core-api-financial.ts`.
 */
import { err, isErr, ok } from '#shared/primitives/result.ts'
import { resultFetch, resultFetchText } from '#external/core-api/result-fetch.ts'
import type { ReconciliationClient } from '#modules/financial/server/application/reconciliation.use-cases.ts'
import type { CedenteAccount } from '#modules/financial/server/domain/reconciliation.io.ts'
import {
  accountStatementSummary,
  batchToModel,
  cedenteAccountToModel,
  cedenteAccountsToModel,
  importToModel,
  manualEntryToModel,
  mapHttpError,
  paidPayablesToModel,
  periodClosedToModel,
  reconciliationCreatedToModel,
  reconciliationPeriodsToModel,
  rejectToModel,
  statementSuggestionsToModel,
  suggestionsToModel,
  transactionReconciliationToModel,
  transactionsToModel,
  undoToModel,
} from './reconciliation.mappers.ts'

// Janela ampla FIXA (determinística, sem relógio): o read-model soma TODOS os movimentos da conta →
// closingBalanceCents = saldo corrente real e counters.pending = total de pendentes. `from`/`to` são
// date-only (z.iso.date no core-api). Falha no statement → mantém os defaults honestos da conta (graceful).
const STATEMENT_FROM = '2000-01-01'
const STATEMENT_TO = '2999-12-31'

const enrichAccountWithStatement = async (
  baseUrl: string,
  acc: CedenteAccount,
  token: string,
): Promise<CedenteAccount> => {
  const r = await resultFetch<unknown>(
    `${baseUrl}/cedente-accounts/${acc.id}/statement?from=${STATEMENT_FROM}&to=${STATEMENT_TO}`,
    { token },
  )
  if (isErr(r)) return acc
  const sum = accountStatementSummary(r.value)
  if (isErr(sum)) return acc
  return {
    ...acc,
    currentBalanceCents: sum.value.closingBalanceCents,
    pendingCount: sum.value.pendingCount,
    lastUpdatedAt: sum.value.lastDate ?? acc.lastUpdatedAt,
  }
}

export const createCoreApiReconciliationClient = (baseUrl: string): ReconciliationClient => ({
  importStatement: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/bank-statements`, {
      method: 'POST',
      body: {
        debitAccountRef: i.debitAccountRef,
        format: i.format,
        content: i.content,
        fileName: i.fileName,
      },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return importToModel(r.value)
  },
  listTransactions: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/bank-statements/${i.statementId}/transactions`, {
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return transactionsToModel(r.value)
  },
  listPaidPayables: async (token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/payables?status=Paid`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    return paidPayablesToModel(r.value)
  },
  listCedenteAccounts: async (token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/cedente-accounts`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    const accounts = cedenteAccountsToModel(r.value)
    if (isErr(accounts)) return accounts
    // #139: enriquece cada conta com saldo corrente + pendências (fan-out por conta ao read-model).
    const enriched = await Promise.all(
      accounts.value.map((acc) => enrichAccountWithStatement(baseUrl, acc, token)),
    )
    return ok(enriched)
  },
  getCedenteAccount: async (id, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/cedente-accounts/${id}`, { token })
    if (isErr(r)) return err(mapHttpError(r.error))
    const acc = cedenteAccountToModel(r.value)
    if (isErr(acc)) return acc
    return ok(await enrichAccountWithStatement(baseUrl, acc.value, token)) // #139: saldo/pendências p/ o hero
  },
  createCedenteAccount: async (i, token) => {
    const typeMap = { Corrente: 'corrente', Poupanca: 'poupanca', Investimento: 'investimento' } as const
    const body = {
      bankCode: i.bankCode,
      ...(i.bankName !== undefined ? { bankName: i.bankName } : {}),
      type: typeMap[i.type],
      agency: i.agency,
      accountNumber: i.accountNumber,
      accountDigit: i.accountDigit,
      document: i.document,
      ...(i.nickname !== undefined ? { nickname: i.nickname } : {}),
      ...(i.openingBalanceCents !== undefined ? { openingBalanceCents: i.openingBalanceCents } : {}),
      ...(i.openingBalanceDate !== undefined ? { openingBalanceDate: i.openingBalanceDate } : {}),
    }
    const r = await resultFetch<unknown>(`${baseUrl}/cedente-accounts`, { method: 'POST', token, body })
    if (isErr(r)) return err(mapHttpError(r.error))
    return cedenteAccountToModel(r.value)
  },
  getSuggestions: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/statement-transactions/${i.transactionId}/suggestions`, {
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return suggestionsToModel(r.value)
  },
  getStatementSuggestions: async (i, token) => {
    // #174: palpites de topo em lote por extrato (uma chamada pinta a banda de todas as transações).
    const r = await resultFetch<unknown>(`${baseUrl}/bank-statements/${i.statementId}/suggestions`, {
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return statementSuggestionsToModel(r.value)
  },
  getTransactionReconciliation: async (i, token) => {
    const r = await resultFetch<unknown>(
      `${baseUrl}/statement-transactions/${i.transactionId}/reconciliation`,
      { token },
    )
    if (isErr(r)) {
      const mapped = mapHttpError(r.error)
      // 404 = transação sem conciliação ativa (pendente/já desfeita) → vazio, não erro.
      if (mapped === 'not-found') return ok(null)
      return err(mapped)
    }
    return transactionReconciliationToModel(r.value)
  },
  rejectSuggestion: async (i, token) => {
    const r = await resultFetch<unknown>(
      `${baseUrl}/statement-transactions/${i.transactionId}/reject-suggestion`,
      { method: 'POST', body: { payableId: i.payableId }, token },
    )
    if (isErr(r)) return err(mapHttpError(r.error))
    return rejectToModel(r.value)
  },
  createReconciliation: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/reconciliations`, {
      method: 'POST',
      body: { transactionId: i.transactionId, payableIds: i.payableIds, difference: i.difference },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return reconciliationCreatedToModel(r.value)
  },
  undoReconciliation: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/reconciliations/${i.reconciliationId}/undo`, {
      method: 'POST',
      body: { reason: i.reason },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return undoToModel(r.value)
  },
  createManualEntry: async (i, token) => {
    const { transactionId, ...template } = i
    const r = await resultFetch<unknown>(`${baseUrl}/statement-transactions/${transactionId}/manual-entry`, {
      method: 'POST',
      body: { ...template },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return manualEntryToModel(r.value)
  },
  batchReconcile: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/reconciliations/batch`, {
      method: 'POST',
      body: { transactionIds: i.transactionIds, template: i.template },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return batchToModel(r.value)
  },
  closePeriod: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/reconciliation-periods/close`, {
      method: 'POST',
      body: { debitAccountRef: i.debitAccountRef, periodStart: i.periodStart, periodEnd: i.periodEnd },
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return periodClosedToModel(r.value)
  },
  listReconciliationPeriods: async (i, token) => {
    const r = await resultFetch<unknown>(
      `${baseUrl}/reconciliation-periods?debitAccountRef=${encodeURIComponent(i.debitAccountRef)}`,
      { token },
    )
    if (isErr(r)) return err(mapHttpError(r.error))
    return reconciliationPeriodsToModel(r.value)
  },
  exportReconciliation: async (i, token) => {
    // Export é TEXTO cru (application/x-ofx | text/csv), não JSON → resultFetchText.
    const r = await resultFetchText(
      `${baseUrl}/reconciliation-periods/${i.periodId}/export?format=${i.format}`,
      { token },
    )
    if (isErr(r)) return err(mapHttpError(r.error))
    return ok({ content: r.value, format: i.format })
  },
})
