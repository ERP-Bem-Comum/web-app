/**
 * Composition root do server/programs. Monta os use-cases com o client real. Env lido DENTRO da função.
 * Programs vive em `/api/v1` (como Parceiros/Usuários) — derivamos a base do `CORE_API_URL` (que inclui
 * o prefixo `/api/v2` usado por auth/contracts).
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { createCoreApiProgramsClient } from './core-api/core-api-programs.ts'
import {
  createListPrograms,
  createCreateProgram,
  createGetProgram,
  createUpdateProgram,
} from '#modules/programs/server/application/programs.use-cases.ts'

type ProgramsServer = ReturnType<typeof build>

const deriveProgramsBase = (coreApiUrl: string): string =>
  coreApiUrl.includes('/api/v2')
    ? coreApiUrl.replace('/api/v2', '/api/v1')
    : `${coreApiUrl.replace(/\/+$/, '')}/api/v1`

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiProgramsClient(deriveProgramsBase(env.CORE_API_URL))
  return {
    listPrograms: createListPrograms({ client }),
    createProgram: createCreateProgram({ client }),
    getProgram: createGetProgram({ client }),
    updateProgram: createUpdateProgram({ client }),
  }
}

let cached: ProgramsServer | undefined
export const programsServer = (): ProgramsServer => (cached ??= build())
