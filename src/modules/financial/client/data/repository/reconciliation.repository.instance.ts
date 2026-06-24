/**
 * Instância da ReconciliationRepository — wire das server functions reais (import direto de
 * server/adapters — boundary §I/§III). `listAccounts`/`getAccount` não têm server fn (costura #168;
 * a porta devolve 'unavailable'). Espelha `financial.repository.instance.ts`.
 */
import { importBankStatementFn } from '#modules/financial/server/adapters/server-fns/import-bank-statement.service.fn.ts'
import { listStatementTransactionsFn } from '#modules/financial/server/adapters/server-fns/list-statement-transactions.query.fn.ts'
import { listPaidPayablesFn } from '#modules/financial/server/adapters/server-fns/list-paid-payables.query.fn.ts'
import { listFinancialReferencesFn } from '#modules/financial/server/adapters/server-fns/list-financial-references.query.fn.ts'
import { getAccountStatementPeriodFn } from '#modules/financial/server/adapters/server-fns/get-account-statement-period.query.fn.ts'
import { getTransactionSuggestionsFn } from '#modules/financial/server/adapters/server-fns/get-transaction-suggestions.query.fn.ts'
import { getStatementSuggestionsFn } from '#modules/financial/server/adapters/server-fns/get-statement-suggestions.query.fn.ts'
import { getTransactionReconciliationFn } from '#modules/financial/server/adapters/server-fns/get-transaction-reconciliation.query.fn.ts'
import { rejectSuggestionFn } from '#modules/financial/server/adapters/server-fns/reject-suggestion.service.fn.ts'
import { createReconciliationFn } from '#modules/financial/server/adapters/server-fns/create-reconciliation.service.fn.ts'
import { undoReconciliationFn } from '#modules/financial/server/adapters/server-fns/undo-reconciliation.service.fn.ts'
import { createManualEntryFn } from '#modules/financial/server/adapters/server-fns/create-manual-entry.service.fn.ts'
import { batchReconcileFn } from '#modules/financial/server/adapters/server-fns/batch-reconcile.service.fn.ts'
import { closeReconciliationPeriodFn } from '#modules/financial/server/adapters/server-fns/close-reconciliation-period.service.fn.ts'
import { reopenReconciliationPeriodFn } from '#modules/financial/server/adapters/server-fns/reopen-reconciliation-period.service.fn.ts'
import { listReconciliationPeriodsFn } from '#modules/financial/server/adapters/server-fns/list-reconciliation-periods.query.fn.ts'
import { exportReconciliationFn } from '#modules/financial/server/adapters/server-fns/export-reconciliation.query.fn.ts'
import { listCedenteAccountsFn } from '#modules/financial/server/adapters/server-fns/list-cedente-accounts.query.fn.ts'
import { getCedenteAccountFn } from '#modules/financial/server/adapters/server-fns/get-cedente-account.query.fn.ts'
import { createCedenteAccountFn } from '#modules/financial/server/adapters/server-fns/create-cedente-account.service.fn.ts'

import { createReconciliationRepository } from './reconciliation.repository.ts'

export const reconciliationRepository = createReconciliationRepository({
  importStatementFn: (opts) => importBankStatementFn(opts),
  listTransactionsFn: (opts) => listStatementTransactionsFn(opts),
  listPaidPayablesFn: () => listPaidPayablesFn(),
  listReferencesFn: () => listFinancialReferencesFn(),
  getAccountStatementPeriodFn: (opts) => getAccountStatementPeriodFn(opts),
  getSuggestionsFn: (opts) => getTransactionSuggestionsFn(opts),
  getStatementSuggestionsFn: (opts) => getStatementSuggestionsFn(opts),
  getTransactionReconciliationFn: (opts) => getTransactionReconciliationFn(opts),
  rejectSuggestionFn: (opts) => rejectSuggestionFn(opts),
  createReconciliationFn: (opts) => createReconciliationFn(opts),
  undoReconciliationFn: (opts) => undoReconciliationFn(opts),
  createManualEntryFn: (opts) => createManualEntryFn(opts),
  batchReconcileFn: (opts) => batchReconcileFn(opts),
  closePeriodFn: (opts) => closeReconciliationPeriodFn(opts),
  reopenPeriodFn: (opts) => reopenReconciliationPeriodFn(opts),
  listReconciliationPeriodsFn: (opts) => listReconciliationPeriodsFn(opts),
  exportReconciliationFn: (opts) => exportReconciliationFn(opts),
  listAccountsFn: () => listCedenteAccountsFn(),
  getAccountFn: (opts) => getCedenteAccountFn(opts),
  createAccountFn: (opts) => createCedenteAccountFn(opts),
})
