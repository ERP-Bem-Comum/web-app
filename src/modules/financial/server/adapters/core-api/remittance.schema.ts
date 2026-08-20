/**
 * Zod do response do pré-voo da remessa — `POST /api/v2/financial/remittances:preview` (boundary §IX,
 * core-api#728/#720). Valida o que entra do backend antes de virar Model.
 *
 * Enums vêm como **string tolerante** e a tradução para os literais do domínio acontece no mapper, como no
 * resto do módulo: um `status`/`route`/`field` novo no backend não pode derrubar a tela inteira.
 *
 * A EXCEÇÃO deliberada são os CONTADORES e os TOTAIS: sem `.catch()`. Se o backend regredir e mandar
 * `readyCount` ausente, aceitar um default zerado faria a tela dizer "nada a enviar" em silêncio — e o
 * operador concluiria que não há o que pagar. Preferimos quebrar alto (`err('server')` no mapper).
 */
import * as z from 'zod'

const CoreApiPayoutGapSchema = z.object({
  field: z.string().trim(),
  reason: z.string().trim(),
})

const CoreApiPreviewLineSchema = z.object({
  documentId: z.string().trim(),
  status: z.string().trim(),
  route: z.string().trim().nullable().catch(null),
  // `missing` existe no DTO, mas é subconjunto de `gaps` (mesmo campo, sem o motivo) — não o lemos para
  // não manter duas representações do mesmo fato no front.
  gaps: z.array(CoreApiPayoutGapSchema).catch([]),
  netValueCents: z.string().trim().catch('0'),
})

export const CoreApiRemittancePreviewSchema = z.object({
  lines: z.array(CoreApiPreviewLineSchema),
  readyCount: z.int().nonnegative(),
  blockedCount: z.int().nonnegative(),
  outOfVanCount: z.int().nonnegative(),
  notFoundCount: z.int().nonnegative(),
  readyTotalCents: z.string().trim(),
  blockedTotalCents: z.string().trim(),
})

/**
 * Resposta 201 da geração. SEM `.catch()` em campo algum: aqui não há default seguro. Um `nsa` ausente
 * aceito como 0, ou um `fileName` vazio, produziria um comprovante que mente sobre um pagamento que já
 * foi enfileirado no banco. Se o backend regredir, é melhor a tela falhar alto.
 */
export const CoreApiGeneratedRemittanceSchema = z.object({
  remittanceId: z.string().trim(),
  fileName: z.string().trim(),
  objectKey: z.string().trim(),
  nsa: z.int().positive(),
  totalCents: z.string().trim(),
  lineCount: z.int().nonnegative(),
})
