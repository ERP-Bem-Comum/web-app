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

// TÍTULO, não nota (core-api#794): a nota dá origem aos títulos, mas o ciclo de vida inteiro é do
// título — forma, vencimento e status são dele, inclusive nas retenções, que são títulos a pagar como
// qualquer outro e podem ficar em aberto com o pai já pago.
const CoreApiPreviewLineSchema = z.object({
  payableId: z.string().trim(),
  // A nota de origem, p/ o front agrupar no grid. `null` em `not-found`: sem o título lido não há
  // vínculo a declarar.
  documentId: z.string().trim().nullable().catch(null),
  status: z.string().trim(),
  route: z.string().trim().nullable().catch(null),
  // `missing` existe no DTO, mas é subconjunto de `gaps` (mesmo campo, sem o motivo) — não o lemos para
  // não manter duas representações do mesmo fato no front.
  gaps: z.array(CoreApiPayoutGapSchema).catch([]),
  // ⚠️ Era `netValueCents` e virou `valueCents`: é o valor DO TÍTULO, e no filho de retenção NÃO é o
  // líquido da nota. SEM `.catch()` de propósito — com um default, a renomeação do campo teria passado
  // silenciosa e a tela mostraria R$ 0,00 em vez de falhar.
  valueCents: z.string().trim(),
})

/**
 * Composição dos lotes (core-api#804, CA7) — como a seleção se reparte no arquivo.
 *
 * `.catch([])` no array inteiro, ao contrário dos contadores: um lote ausente faz a tela OMITIR o painel,
 * e omitir não afirma nada de errado. Um contador ausente aceito como zero, sim, afirmaria — diria "nada
 * a enviar" a quem tem títulos para pagar. São dois riscos diferentes e por isso duas políticas.
 */
const CoreApiPreviewBatchSchema = z.object({
  launchForm: z.string().trim(),
  launchFormLabel: z.string().trim(),
  payeeBankCode: z.string().trim().nullable().catch(null),
  count: z.int().positive(),
  totalCents: z.string().trim(),
})

export const CoreApiRemittancePreviewSchema = z.object({
  lines: z.array(CoreApiPreviewLineSchema),
  batches: z.array(CoreApiPreviewBatchSchema).catch([]),
  readyCount: z.int().nonnegative(),
  blockedCount: z.int().nonnegative(),
  outOfVanCount: z.int().nonnegative(),
  notFoundCount: z.int().nonnegative(),
  // #736 virou status de linha: o backend agora informa quantos não estão aprovados.
  notApprovedCount: z.int().nonnegative().catch(0),
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
