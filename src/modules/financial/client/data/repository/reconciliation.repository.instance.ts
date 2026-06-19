/**
 * Instância da ReconciliationRepository — wire das server functions reais (import direto de
 * server/adapters — boundary §I/§III). `listAccounts`/`getAccount` não têm server fn (costura #168;
 * a porta devolve 'unavailable'). Espelha `financial.repository.instance.ts`.
 */
import { importBankStatementFn } from '#modules/financial/server/adapters/server-fns/import-bank-statement.service.fn.ts'
import { listStatementTransactionsFn } from '#modules/financial/server/adapters/server-fns/list-statement-transactions.query.fn.ts'
import { listPaidPayablesFn } from '#modules/financial/server/adapters/server-fns/list-paid-payables.query.fn.ts'
import { getTransactionSuggestionsFn } from '#modules/financial/server/adapters/server-fns/get-transaction-suggestions.query.fn.ts'
import { rejectSuggestionFn } from '#modules/financial/server/adapters/server-fns/reject-suggestion.service.fn.ts'
import { createReconciliationFn } from '#modules/financial/server/adapters/server-fns/create-reconciliation.service.fn.ts'
import { undoReconciliationFn } from '#modules/financial/server/adapters/server-fns/undo-reconciliation.service.fn.ts'
import { createManualEntryFn } from '#modules/financial/server/adapters/server-fns/create-manual-entry.service.fn.ts'
import { batchReconcileFn } from '#modules/financial/server/adapters/server-fns/batch-reconcile.service.fn.ts'
import { closeReconciliationPeriodFn } from '#modules/financial/server/adapters/server-fns/close-reconciliation-period.service.fn.ts'
import { listCedenteAccountsFn } from '#modules/financial/server/adapters/server-fns/list-cedente-accounts.query.fn.ts'
import { getCedenteAccountFn } from '#modules/financial/server/adapters/server-fns/get-cedente-account.query.fn.ts'

import { createReconciliationRepository } from './reconciliation.repository.ts'

export const reconciliationRepository = createReconciliationRepository({
  importStatementFn: (opts) => importBankStatementFn(opts),
  listTransactionsFn: (opts) => listStatementTransactionsFn(opts),
  listPaidPayablesFn: () => listPaidPayablesFn(),
  getSuggestionsFn: (opts) => getTransactionSuggestionsFn(opts),
  rejectSuggestionFn: (opts) => rejectSuggestionFn(opts),
  createReconciliationFn: (opts) => createReconciliationFn(opts),
  undoReconciliationFn: (opts) => undoReconciliationFn(opts),
  createManualEntryFn: (opts) => createManualEntryFn(opts),
  batchReconcileFn: (opts) => batchReconcileFn(opts),
  closePeriodFn: (opts) => closeReconciliationPeriodFn(opts),
  listAccountsFn: () => listCedenteAccountsFn(),
  getAccountFn: (opts) => getCedenteAccountFn(opts),
})
