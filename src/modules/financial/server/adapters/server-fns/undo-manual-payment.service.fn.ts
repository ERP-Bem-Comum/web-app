/**
 * Server function: desfazer a baixa (POST /api/v2/financial/documents/:id/payables/:payableId/undo-manual-payment,
 * Pago → status anterior à baixa). Spec 119 / core-api#61.
 * Fronteira RPC (§III). RBAC `payable:approve` (checado no core-api). Motivo obrigatório.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { UndoPayableInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { DocumentDetail } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type UndoManualPaymentFnResult =
  | Readonly<{ ok: true; data: DocumentDetail }>
  // A MENSAGEM PT-BR do core-api viaja junto: as recusas são todas 409 → `conflict`, e só o texto diz
  // qual foi e o que fazer (desfazer a conciliação antes, descartar a remessa na fila…).
  | Readonly<{ ok: false; error: FinancialError; message: string | null }>

export const undoManualPaymentFn = createServerFn({ method: 'POST' })
  .validator(UndoPayableInputSchema)
  .handler(async ({ data }): Promise<UndoManualPaymentFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized', message: null }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized', message: null }

    const r = await financialServer().undoManualPayment(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error.error, message: r.error.message }
    return { ok: true, data: r.value }
  })
