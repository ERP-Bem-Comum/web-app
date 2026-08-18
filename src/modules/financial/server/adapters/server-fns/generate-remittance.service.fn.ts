/**
 * Server function: GERA a remessa CNAB 240 da VAN (POST /api/v2/financial/remittances, core-api#728/#720).
 * Fronteira RPC (§III). RBAC `remittance:generate` no core-api — distinto de `remittance:read`, que é o do
 * pré-voo: conferir o que sai não é disparar pagamento.
 *
 * ⚠️ **É A ÚNICA `fn` DO MÓDULO QUE MOVE DINHEIRO.** Ela grava o arquivo em `saida/` no bucket da VAN, e
 * gravar ali é ENFILEIRAR PAGAMENTO no banco (ADR-0060). Não há "gerar para testar": o bucket de produção
 * não tem prefixo de sandbox. Consome NSA — número sequencial que NÃO volta se algo falhar adiante — e
 * prende os documentos, impedindo que entrem noutra remessa.
 *
 * Por isso ela é `.service.fn.ts` (comando) e não `.query.fn.ts`, e por isso a UI só a chama depois de uma
 * confirmação explícita.
 *
 * O erro carrega a MENSAGEM PT-BR do core-api junto da tag: quatro recusas distintas (sem dados, forma não
 * emitida, vencimentos misturados, conta sem convênio) chegam como o mesmo 422, e só o texto as separa.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import {
  REMITTANCE_PREVIEW_MAX_IDS,
  type GeneratedRemittance,
} from '#modules/financial/server/domain/remittance.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type GenerateRemittanceFnResult =
  | Readonly<{ ok: true; data: GeneratedRemittance }>
  | Readonly<{ ok: false; error: FinancialError; message: string | null }>

export const generateRemittanceFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      cedenteAccountId: z.uuid(),
      // Mesmo teto do pré-voo (200): o operador confere e gera a MESMA seleção, e um limite diferente
      // faria a conferência aprovar um lote que a geração recusa.
      documentIds: z.array(z.uuid()).min(1).max(REMITTANCE_PREVIEW_MAX_IDS).readonly(),
    }),
  )
  .handler(async ({ data }): Promise<GenerateRemittanceFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized', message: null }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized', message: null }

    const r = await financialServer().generateRemittance(
      { cedenteAccountId: data.cedenteAccountId, documentIds: data.documentIds },
      accessToken,
    )
    if (isErr(r)) return { ok: false, error: r.error.error, message: r.error.message }
    return { ok: true, data: r.value }
  })
