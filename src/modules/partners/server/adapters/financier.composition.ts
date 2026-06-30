/**
 * Composition root do server/financier. Monta os use-cases com o client real. Env lido DENTRO da função.
 * Parceiros vivem em `/api/v1` (ADR-0033) — derivamos a base do `CORE_API_URL`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiFinanciersClient } from './core-api/core-api-financiers.ts'
import {
  createListFinanciers,
  createGetFinancier,
  createCreateFinancier,
  createUpdateFinancier,
  createDeactivateFinancier,
  createReactivateFinancier,
} from '#modules/partners/server/application/financier/financier.use-cases.ts'

type FinancierServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiFinanciersClient(coreApiBase(env.CORE_API_URL, 'v1'))
  return {
    listFinanciers: createListFinanciers({ client }),
    getFinancier: createGetFinancier({ client }),
    createFinancier: createCreateFinancier({ client }),
    updateFinancier: createUpdateFinancier({ client }),
    deactivateFinancier: createDeactivateFinancier({ client }),
    reactivateFinancier: createReactivateFinancier({ client }),
  }
}

let cached: FinancierServer | undefined
export const financierServer = (): FinancierServer => (cached ??= build())
