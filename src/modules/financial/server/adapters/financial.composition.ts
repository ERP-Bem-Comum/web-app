/**
 * Composition root do server/financial. Monta os use-cases com o client real. Env lido DENTRO da função
 * (nunca em escopo de módulo). Financeiro vive em `/api/v2/financial` (modelo novo, como auth/contracts —
 * ADR-0033). A base de versão vem do helper único `coreApiBase`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiFinancialClient } from './core-api/core-api-financial.ts'
import { createDashboardRealizedClient } from './core-api/core-api-dashboard-realized.ts'
import { createGetDashboardAggregationsReal } from './dashboard-statistics.real-source.ts'
import { createGetDashboardRealized } from '#modules/financial/server/application/dashboard-realized.use-cases.ts'
import {
  createListDocuments,
  createListPayableTitles,
  createListAllPayableTitles,
  createGetPayableCounts,
  createGetDocument,
  createGetDocumentSourceFile,
  createGetDocumentTimeline,
  createCreateDocument,
  createAdjustDocument,
  createApproveDocument,
  createUpdatePayableDueDate,
  createUndoApproval,
  createCancelDocument,
  createRegisterManualPayment,
  createGetRecentPayments,
  createPreviewRemittance,
  createGenerateRemittance,
} from '#modules/financial/server/application/financial.use-cases.ts'
import { createGetDashboardStatistics } from '#modules/financial/server/application/dashboard.use-cases.ts'

type FinancialServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const base = coreApiBase(env.CORE_API_URL, 'v2')
  const client = createCoreApiFinancialClient(`${base}/financial`)
  // P3: gráfico Realizado × Previsto orquestra /reports/dashboard/realized + /budget-plans (base raiz).
  const realizedClient = createDashboardRealizedClient(base)
  return {
    listDocuments: createListDocuments({ client }),
    listPayableTitles: createListPayableTitles({ client }),
    // specs/101: conjunto completo do filtro (busca/seleção/remessa não podem enxergar só a página).
    listAllPayableTitles: createListAllPayableTitles({ client }),
    getPayableCounts: createGetPayableCounts({ client }),
    getDocument: createGetDocument({ client }),
    getDocumentSourceFile: createGetDocumentSourceFile({ client }),
    getDocumentTimeline: createGetDocumentTimeline({ client }),
    createDocument: createCreateDocument({ client }),
    adjustDocument: createAdjustDocument({ client }),
    approveDocument: createApproveDocument({ client }),
    updatePayableDueDate: createUpdatePayableDueDate({ client }),
    undoApproval: createUndoApproval({ client }),
    cancelDocument: createCancelDocument({ client }),
    registerManualPayment: createRegisterManualPayment({ client }),
    getRecentPayments: createGetRecentPayments({ client }),
    // VAN (core-api#728): pré-voo do lote da remessa CNAB 240. Leitura pura — não gera arquivo.
    previewRemittance: createPreviewRemittance({ client }),
    // ⚠️ specs/101 S3: gerar ENFILEIRA PAGAMENTO no banco (ADR-0060 do core-api).
    generateRemittance: createGenerateRemittance({ client }),
    // Dashboard (specs/096): de-interim FASEADO. P1 = cost-centers real (#241/#237); P2/P3 e as métricas
    // Receita/Maior-Financiador (sem endpoint) seguem interinas dentro da fonte real. Composição pura intacta.
    getDashboardStatistics: createGetDashboardStatistics({
      source: { getAggregations: createGetDashboardAggregationsReal({ client }) },
    }),
    // P3 (specs/096): gráfico Realizado × Previsto — planos aprovados vigentes (todos somados | 1 plano).
    getDashboardRealized: createGetDashboardRealized({ client: realizedClient }),
  }
}

let cached: FinancialServer | undefined
export const financialServer = (): FinancialServer => (cached ??= build())
