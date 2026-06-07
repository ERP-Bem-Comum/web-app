/**
 * Server function: import em lote de colaboradores (CSV). Fronteira RPC (Princ. I). Recebe a STRING CSV
 * (o client leu `File.text()`), valida tamanho/forma com Zod, autentica, e o use-case repassa `text/csv`
 * ao core-api. Retorna o relatório parcial `{ created, failed }` como SUCESSO (não erro). FR-007.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { collaboratorServer } from '../../collaborator.composition.ts'
import {
  ImportCollaboratorsInputSchema,
  type CollaboratorImportResult,
} from '#modules/partners/server/domain/collaborator/collaborator.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ImportCollaboratorsFnResult =
  | Readonly<{ ok: true; data: CollaboratorImportResult }>
  | Readonly<{ ok: false; error: PartnersError }>

export const importCollaboratorsFn = createServerFn({ method: 'POST' })
  .inputValidator(ImportCollaboratorsInputSchema)
  .handler(async ({ data }): Promise<ImportCollaboratorsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await collaboratorServer().importCollaborators(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
