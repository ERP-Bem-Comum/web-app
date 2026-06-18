/**
 * Server function: export do HISTÓRICO de alterações de um colaborador (CSV). Fronteira RPC.
 * Autentica na borda e repassa o `text/csv` do core-api (`GET /collaborators/:id/export?type=history`);
 * o client cria o Blob e dispara o download. O RBAC (`collaborator:read`) é checado pelo core-api
 * (403 → forbidden). Histórico vazio = CSV só com cabeçalho (sucesso). 503 (reader) → server.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { exportCollaboratorHistory } from '../../partners-export.composition.ts'
import type { PartnerExportFile } from '#modules/partners/server/adapters/core-api/core-api-partners-export.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

const ExportCollaboratorHistoryInputSchema = z.object({ id: z.uuid() })

export type ExportCollaboratorHistoryFnResult =
  | Readonly<{ ok: true; data: PartnerExportFile }>
  | Readonly<{ ok: false; error: PartnersError }>

export const exportCollaboratorHistoryFn = createServerFn({ method: 'GET' })
  .inputValidator(ExportCollaboratorHistoryInputSchema)
  .handler(async ({ data }): Promise<ExportCollaboratorHistoryFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await exportCollaboratorHistory(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
