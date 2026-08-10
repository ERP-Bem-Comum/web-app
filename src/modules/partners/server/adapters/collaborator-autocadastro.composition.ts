/**
 * Composition root PÚBLICA do Autocadastro (#040). Monta os use-cases com o client REAL público (sem
 * Bearer). Env lido DENTRO da função (nunca em escopo de módulo). Mesma base v1 dos colaboradores
 * (ADR-0033 Strangler Fig) — derivada do `CORE_API_URL` via `coreApiBase(url, 'v1')`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiCollaboratorAutocadastroClient } from './core-api/core-api-collaborator-autocadastro.ts'
import {
  createAutocadastroPreview,
  createAutocadastroSubmit,
} from '#modules/partners/server/application/collaborator/collaborator-autocadastro.use-cases.ts'

type AutocadastroServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiCollaboratorAutocadastroClient(coreApiBase(env.CORE_API_URL, 'v1'))
  return {
    autocadastroPreview: createAutocadastroPreview({ client }),
    autocadastroSubmit: createAutocadastroSubmit({ client }),
  }
}

let cached: AutocadastroServer | undefined
export const collaboratorAutocadastroServer = (): AutocadastroServer => (cached ??= build())
