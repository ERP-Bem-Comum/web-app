/**
 * Server function: BAIXA o arquivo da remessa (GET /api/v2/financial/remittances/:id/file, specs/103).
 * Fronteira RPC (§III). RBAC `remittance:read` no core-api — o mesmo do pré-voo: baixar uma cópia para
 * conferir não é disparar pagamento.
 *
 * **Homologação apenas.** Em produção o core-api NÃO REGISTRA a rota (404 por ausência, não 403 por
 * decisão), porque o arquivo carrega o cadastro bancário de todos os favorecidos do lote. Aqui isso chega
 * como `not-found` sem mensagem — e é a UI que traduz para "só existe em homologação".
 *
 * É `.query.fn.ts` (leitura) e não `.service.fn.ts`: serve o objeto que JÁ está no bucket. Não regera, não
 * consome NSA e não prende documento — ao contrário da geração, que é a única `fn` do módulo que move
 * dinheiro. Regerar produziria outro NSA e outro carimbo de tempo, e arquivo parecido não é evidência.
 *
 * Os bytes trafegam como **base64**: a fronteira é JSON e o token nunca sai do server (§IX). Quem monta o
 * Blob é o binding, no browser.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import type { RemittanceFile } from '#modules/financial/server/domain/remittance.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type DownloadRemittanceFileFnResult =
  | Readonly<{ ok: true; data: RemittanceFile }>
  | Readonly<{ ok: false; error: FinancialError; message: string | null }>

export const downloadRemittanceFileFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ remittanceId: z.uuid() }))
  .handler(async ({ data }): Promise<DownloadRemittanceFileFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized', message: null }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized', message: null }

    const r = await financialServer().downloadRemittanceFile(data.remittanceId, accessToken)
    if (isErr(r)) return { ok: false, error: r.error.error, message: r.error.message }
    return { ok: true, data: r.value }
  })
