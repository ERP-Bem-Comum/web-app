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

// O core-api#804 passou a devolver `batches[]` (como a seleção se reparte no arquivo). NÃO o lemos: a
// P.O. avaliou o painel na tela e concluiu que ele não acrescenta nada à conferência — quem confere olha
// título a título, e a repartição em lotes é assunto do arquivo, não do operador. O Zod ignora campos
// desconhecidos, então o campo extra do backend passa sem ruído.
export const CoreApiRemittancePreviewSchema = z.object({
  lines: z.array(CoreApiPreviewLineSchema),
  readyCount: z.int().nonnegative(),
  blockedCount: z.int().nonnegative(),
  outOfVanCount: z.int().nonnegative(),
  notFoundCount: z.int().nonnegative(),
  // #736 virou status de linha: o backend agora informa quantos não estão aprovados.
  notApprovedCount: z.int().nonnegative().catch(0),
  // O core-api#792 acrescentou `transmittedCount`. NÃO o lemos, pela mesma razão do `batches[]` e do
  // `missing` acima: o fato já chega por linha (`status: 'transmitted'`), e o resumo da tela conta as
  // linhas impedidas. Ler o contador seria manter duas representações do mesmo fato — e a que ninguém
  // olha é a que sai de sincronia primeiro.
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
