/**
 * Cliente HTTP PÚBLICO do core-api para o Autocadastro (#040) — chama `/api/v1/collaborators/autocadastro`
 * SEM Authorization (rota pública token-based, como o auth reset-password). NUNCA lança (tudo é Result).
 * Server-only (adapters). Anti-corruption layer: valida o shape do preview com Zod e mapeia o envelope de
 * erro do core-api → PartnersError, com a semântica específica do autocadastro:
 *   - 404 (token desconhecido/expirado/usado) → `autocadastro-invalid` (anti-enumeração; NÃO `not-found`).
 *   - 400 com slug `collaborator-autocadastro-cpf-mismatch` → `autocadastro-cpf-mismatch` (token preservado).
 *   - outros 400/422 → `validation`; 5xx/parse → `server`; rede/timeout → `connectivity`.
 */
import * as z from 'zod'

import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type { AutocadastroClient } from '#modules/partners/server/application/collaborator/collaborator-autocadastro.use-cases.ts'
import type { AutocadastroPreview } from '#modules/partners/server/domain/collaborator/collaborator-autocadastro.io.ts'

// Slug REAL do core-api p/ CPF divergente (400) → erro-valor específico (token preservado no fluxo).
const CPF_MISMATCH_SLUG = 'collaborator-autocadastro-cpf-mismatch'

// Shape do preview validado na borda (§IX). Se o backend derivar, tratamos como drift de contrato → 'server'.
const CoreApiAutocadastroPreviewSchema = z.object({
  collaboratorId: z.string().trim(),
  name: z.string().trim(),
  cpfMasked: z.string().trim(),
})

const statusToError = (status: number, slug: string | undefined): PartnersError => {
  if (status === 404) return 'autocadastro-invalid' // anti-enumeração: token desconhecido/expirado/usado
  if (status === 400 && slug === CPF_MISMATCH_SLUG) return 'autocadastro-cpf-mismatch'
  if (status === 400 || status === 422) return 'validation'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 409) return 'conflict'
  return 'server'
}

const mapHttpError = (e: HttpError): PartnersError => {
  switch (e.kind) {
    case 'http':
      return statusToError(e.status, parseErrorEnvelope(e.body)?.error.code)
    case 'network':
    case 'timeout':
      return 'connectivity'
    case 'parse':
    case 'aborted':
      return 'server'
    default: {
      const exhaustive: never = e
      return exhaustive
    }
  }
}

const previewToModel = (raw: unknown): Result<AutocadastroPreview, PartnersError> => {
  const parsed = CoreApiAutocadastroPreviewSchema.safeParse(raw)
  if (!parsed.success) return err('server') // drift de contrato
  return ok({
    collaboratorId: parsed.data.collaboratorId,
    name: parsed.data.name,
    cpfMasked: parsed.data.cpfMasked,
  })
}

export const createCoreApiCollaboratorAutocadastroClient = (baseUrl: string): AutocadastroClient => ({
  // GET público: sem Bearer. O token vai no query string (é o mecanismo de auth do link).
  preview: async (token) => {
    const query = new URLSearchParams({ token }).toString()
    const r = await resultFetch<unknown>(`${baseUrl}/collaborators/autocadastro?${query}`, {
      method: 'GET',
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return previewToModel(r.value)
  },

  // POST público: sem Bearer. Body = { token, cpfPrefix, ...campos da 2ª fase }. 200 → ok(void).
  submit: async (input) => {
    const r = await resultFetch<unknown>(`${baseUrl}/collaborators/autocadastro`, {
      method: 'POST',
      body: input,
    })
    if (isErr(r)) return err(mapHttpError(r.error))
    return ok(undefined)
  },
})
