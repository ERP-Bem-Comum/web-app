/**
 * Composition root do server/programs. Monta os use-cases com o client real. Env lido DENTRO da função.
 * Programs vive em `/api/v1` (legado espelhado, como Parceiros/Usuários — ADR-0033); a base de versão
 * vem do helper único `coreApiBase`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiProgramsClient } from './core-api/core-api-programs.ts'
import {
  createListPrograms,
  createCreateProgram,
  createGetProgram,
  createUpdateProgram,
} from '#modules/programs/server/application/programs.use-cases.ts'

type ProgramsServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiProgramsClient(coreApiBase(env.CORE_API_URL, 'v1'))
  return {
    listPrograms: createListPrograms({ client }),
    createProgram: createCreateProgram({ client }),
    getProgram: createGetProgram({ client }),
    updateProgram: createUpdateProgram({ client }),
    // Logo (binário) — passthrough fino: I/O puro, sem regra de domínio.
    getLogo: (id: string, token: string) => client.getLogo(id, token),
    uploadLogo: (id: string, input: { bytes: Uint8Array; mimeType: string }, token: string) =>
      client.uploadLogo(id, input, token),
  }
}

let cached: ProgramsServer | undefined
export const programsServer = (): ProgramsServer => (cached ??= build())
