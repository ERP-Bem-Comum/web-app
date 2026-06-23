/**
 * Composition root do server/financial. Monta os use-cases com o client real. Env lido DENTRO da função
 * (nunca em escopo de módulo). Financeiro vive em `/api/v2/financial` (modelo novo, como auth/contracts —
 * ADR-0033). A base de versão vem do helper único `coreApiBase`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiFinancialClient } from './core-api/core-api-financial.ts'
import {
  createListDocuments,
  createListPayableTitles,
  createGetDocument,
  createCreateDocument,
  createAdjustDocument,
  createApproveDocument,
  createUndoApproval,
  createCancelDocument,
} from '#modules/financial/server/application/financial.use-cases.ts'

type FinancialServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiFinancialClient(`${coreApiBase(env.CORE_API_URL, 'v2')}/financial`)
  return {
    listDocuments: createListDocuments({ client }),
    listPayableTitles: createListPayableTitles({ client }),
    getDocument: createGetDocument({ client }),
    createDocument: createCreateDocument({ client }),
    adjustDocument: createAdjustDocument({ client }),
    approveDocument: createApproveDocument({ client }),
    undoApproval: createUndoApproval({ client }),
    cancelDocument: createCancelDocument({ client }),
  }
}

let cached: FinancialServer | undefined
export const financialServer = (): FinancialServer => (cached ??= build())
