/**
 * Cliente HTTP do core-api para a Conciliação Bancária — chama `/api/v2/financial/...` (PR #152). NUNCA
 * lança (tudo é Result; `throw` só na borda do `resultFetch`). Server-only (adapters). Anti-corruption:
 * delega a tradução aos mappers PUROS (`reconciliation.mappers.ts`) e o erro a `mapHttpError`. Espelha
 * `core-api-financial.ts`.
 */
import { err, isErr } from '#shared/primitives/result.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { ReconciliationClient } from '#modules/financial/server/application/reconciliation.use-cases.ts'
import {
  batchToModel,
  importToModel,
  manualEntryToModel,
  mapHttpError,
  paidPayablesToModel,
  periodClosedToModel,
  reconciliationCreatedToModel,
  rejectToModel,
  suggestionsToModel,
  transactionsToModel,
  undoToModel,
} from './reconciliation.mappers.ts'

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
  getSuggestions: async (i, token) => {
    const r = await resultFetch<unknown>(`${baseUrl}/statement-transactions/${i.transactionId}/suggestions`, {
      token,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return suggestionsToModel(r.value)
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
})
