/**
 * Composition root do server/act. Monta os use-cases com o client real. Env lido DENTRO da função
 * (nunca em escopo de módulo). Parceiros vivem em `/api/v1` (ADR-0033) — derivamos a base do
 * `CORE_API_URL` (que inclui o prefixo `/api/v2` usado por auth/contracts).
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { createCoreApiActsClient } from './core-api/core-api-acts.ts'
import {
  createListActs,
  createGetAct,
  createCreateAct,
  createUpdateAct,
  createDeactivateAct,
  createReactivateAct,
} from '#modules/partners/server/application/act/act.use-cases.ts'

type ActServer = ReturnType<typeof build>

// CORE_API_URL inclui o prefixo de versão (auth/contracts usam /api/v2). Parceiros vivem em /api/v1
// (ADR-0033). Deriva de forma robusta: troca o /api/v2 se presente; senão anexa /api/v1.
const derivePartnersBase = (coreApiUrl: string): string =>
  coreApiUrl.includes('/api/v2')
    ? coreApiUrl.replace('/api/v2', '/api/v1')
    : `${coreApiUrl.replace(/\/+$/, '')}/api/v1`

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiActsClient(derivePartnersBase(env.CORE_API_URL))
  return {
    listActs: createListActs({ client }),
    getAct: createGetAct({ client }),
    createAct: createCreateAct({ client }),
    updateAct: createUpdateAct({ client }),
    deactivateAct: createDeactivateAct({ client }),
    reactivateAct: createReactivateAct({ client }),
  }
}

let cached: ActServer | undefined
export const actServer = (): ActServer => (cached ??= build())
