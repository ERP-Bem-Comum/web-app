/**
 * Server function: aprovar documento (POST /api/v2/financial/documents/:id/approve, Aberto → Aprovado).
 * Fronteira RPC (§III). RBAC `payable:approve` — distinto de quem lança (separação de funções). UI na onda 2.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { ApproveInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { DocumentDetail } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type ApproveDocumentFnResult =
  | Readonly<{ ok: true; data: DocumentDetail }>
  // A MENSAGEM PT-BR do core-api viaja junto: as recusas do aprovador chegam todas como 422 →
  // `validation`, e sem o texto a tela acusa os dados do documento por um problema do aprovador.
  | Readonly<{ ok: false; error: FinancialError; message: string | null }>

export const approveDocumentFn = createServerFn({ method: 'POST' })
  .inputValidator(ApproveInputSchema)
  .handler(async ({ data }): Promise<ApproveDocumentFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized', message: null }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized', message: null }

    const r = await financialServer().approveDocument(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error.error, message: r.error.message }
    return { ok: true, data: r.value }
  })
