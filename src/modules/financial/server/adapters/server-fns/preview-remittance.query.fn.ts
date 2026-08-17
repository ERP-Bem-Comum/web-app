/**
 * Server function: PRÉ-VOO do lote da remessa (POST /api/v2/financial/remittances:preview, core-api#728).
 * Fronteira RPC (§III) — o browser nunca fala com o core-api. RBAC `remittance:read` (checado no core-api;
 * o 403 chega como `forbidden`).
 *
 * É LEITURA PURA, e é isso que a separa da geração: não consome NSA, não prende título e não toca no bucket
 * da VAN. Conferir o que sai não é disparar pagamento — por isso o core-api exige `remittance:read` aqui e
 * `remittance:generate` lá.
 *
 * O método é POST porque a seleção (até 200 ids) vai no corpo, não porque escreva algo.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import {
  REMITTANCE_PREVIEW_MAX_IDS,
  type RemittancePreview,
} from '#modules/financial/server/domain/remittance.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type PreviewRemittanceFnResult =
  | Readonly<{ ok: true; data: RemittancePreview }>
  | Readonly<{ ok: false; error: FinancialError }>

export const previewRemittanceFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      // O teto de 200 espelha o do core-api. Validar aqui evita a ida ao backend só para levar um 400 —
      // e o `min(1)` impede a chamada vazia que o operador dispararia sem querer.
      // `.readonly()` mantém a imutabilidade por padrão (§VII) atravessando a fronteira RPC: sem ele o
      // tipo inferido é `string[]` mutável e o repository (que fala em `readonly string[]`) não encaixa.
      documentIds: z.array(z.uuid()).min(1).max(REMITTANCE_PREVIEW_MAX_IDS).readonly(),
    }),
  )
  .handler(async ({ data }): Promise<PreviewRemittanceFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().previewRemittance({ documentIds: data.documentIds }, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
