/**
 * Composition root do server/financial. Monta os use-cases com o client real. Env lido DENTRO da função
 * (nunca em escopo de módulo). Financeiro vive em `/api/v2/financial` (como auth/contracts) — derivamos a
 * base do `CORE_API_URL` (que já inclui o prefixo `/api/v2`). Espelha `users.composition.ts`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { createCoreApiFinancialClient } from './core-api/core-api-financial.ts'
import {
  createListDocuments,
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
  const client = createCoreApiFinancialClient(`${env.CORE_API_URL.replace(/\/+$/, '')}/financial`)
  return {
    listDocuments: createListDocuments({ client }),
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
