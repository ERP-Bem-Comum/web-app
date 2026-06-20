/**
 * Composition root do server/financial (conciliação). Monta os use-cases com o client real. Env lido
 * DENTRO da função (nunca em escopo de módulo). Financeiro vive em `/api/v2/financial`. Separado de
 * `financial.composition.ts` (Contas a Pagar) para isolar a costura nova. Espelha aquele.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiReconciliationClient } from './core-api/core-api-reconciliation.ts'
import {
  createBatchReconcile,
  createClosePeriod,
  createCreateManualEntry,
  createCreateCedenteAccount,
  createCreateReconciliation,
  createExportReconciliation,
  createGetCedenteAccount,
  createGetStatementSuggestions,
  createGetSuggestions,
  createGetTransactionReconciliation,
  createImportStatement,
  createListCedenteAccounts,
  createListPaidPayables,
  createListReconciliationPeriods,
  createListTransactions,
  createRejectSuggestion,
  createUndoReconciliation,
} from '#modules/financial/server/application/reconciliation.use-cases.ts'

type ReconciliationServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiReconciliationClient(`${coreApiBase(env.CORE_API_URL, 'v2')}/financial`)
  return {
    importStatement: createImportStatement({ client }),
    listTransactions: createListTransactions({ client }),
    listPaidPayables: createListPaidPayables({ client }),
    listCedenteAccounts: createListCedenteAccounts({ client }),
    getCedenteAccount: createGetCedenteAccount({ client }),
    createCedenteAccount: createCreateCedenteAccount({ client }),
    getSuggestions: createGetSuggestions({ client }),
    getStatementSuggestions: createGetStatementSuggestions({ client }),
    getTransactionReconciliation: createGetTransactionReconciliation({ client }),
    rejectSuggestion: createRejectSuggestion({ client }),
    createReconciliation: createCreateReconciliation({ client }),
    undoReconciliation: createUndoReconciliation({ client }),
    createManualEntry: createCreateManualEntry({ client }),
    batchReconcile: createBatchReconcile({ client }),
    closePeriod: createClosePeriod({ client }),
    listReconciliationPeriods: createListReconciliationPeriods({ client }),
    exportReconciliation: createExportReconciliation({ client }),
  }
}

let cached: ReconciliationServer | undefined
export const reconciliationServer = (): ReconciliationServer => (cached ??= build())
