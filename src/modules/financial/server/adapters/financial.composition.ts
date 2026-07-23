/**
 * Composition root do server/financial. Monta os use-cases com o client real. Env lido DENTRO da função
 * (nunca em escopo de módulo). Financeiro vive em `/api/v2/financial` (modelo novo, como auth/contracts —
 * ADR-0033). A base de versão vem do helper único `coreApiBase`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiFinancialClient } from './core-api/core-api-financial.ts'
import { getDashboardAggregationsPlaceholder } from './dashboard-statistics.placeholder-source.ts'
import {
  createListDocuments,
  createListPayableTitles,
  createGetPayableCounts,
  createGetDocument,
  createGetDocumentTimeline,
  createCreateDocument,
  createAdjustDocument,
  createApproveDocument,
  createUpdatePayableDueDate,
  createUndoApproval,
  createCancelDocument,
  createRegisterManualPayment,
  createGetRecentPayments,
} from '#modules/financial/server/application/financial.use-cases.ts'
import { createGetDashboardStatistics } from '#modules/financial/server/application/dashboard.use-cases.ts'

type FinancialServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiFinancialClient(`${coreApiBase(env.CORE_API_URL, 'v2')}/financial`)
  return {
    listDocuments: createListDocuments({ client }),
    listPayableTitles: createListPayableTitles({ client }),
    getPayableCounts: createGetPayableCounts({ client }),
    getDocument: createGetDocument({ client }),
    getDocumentTimeline: createGetDocumentTimeline({ client }),
    createDocument: createCreateDocument({ client }),
    adjustDocument: createAdjustDocument({ client }),
    approveDocument: createApproveDocument({ client }),
    updatePayableDueDate: createUpdatePayableDueDate({ client }),
    undoApproval: createUndoApproval({ client }),
    cancelDocument: createCancelDocument({ client }),
    registerManualPayment: createRegisterManualPayment({ client }),
    getRecentPayments: createGetRecentPayments({ client }),
    // Dashboard (052/#352): fonte de agregações INTERINA (placeholder até core-api#112) + composição pura.
    getDashboardStatistics: createGetDashboardStatistics({
      source: { getAggregations: getDashboardAggregationsPlaceholder },
    }),
  }
}

let cached: FinancialServer | undefined
export const financialServer = (): FinancialServer => (cached ??= build())
