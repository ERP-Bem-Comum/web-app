/**
 * VAN bancária / Remessa CNAB 240 — tipos de I/O do domínio (PUROS, sem Zod — §VI). Os schemas Zod vivem
 * na borda (`../adapters/core-api/remittance.schema.ts`). Alinhado ao contrato REAL do core-api
 * (`POST /api/v2/financial/remittances:preview`, core-api#728/#720).
 *
 * Só o PRÉ-VOO mora aqui. Ele é LEITURA PURA: não consome NSA, não prende título e não toca no bucket da
 * VAN. A geração (que grava em `saida/` e por isso ENFILEIRA PAGAMENTO — ADR-0060) é outra fatia.
 *
 * Dinheiro trafega como **string de CENTAVOS**, como no resto do módulo.
 */

/** Trilho pelo qual o título sairia no arquivo. `null` quando não há trilho (documento fora da VAN). */
export type VanRoute = 'pix' | 'transfer' | 'billet' | 'tax-guide'

/**
 * Campo do cadastro que falta ou está impróprio. Vem em LISTA (não como frase) de propósito: é o que
 * permite a tela apontar o input em vez de interpretar prosa.
 */
export type PayoutField =
  | 'pix-key'
  | 'payee-bank-code'
  | 'payee-agency'
  | 'payee-account-number'
  | 'payee-account-digit'
  | 'payment-detail'

/**
 * O motivo viaja junto do campo porque a AÇÃO do operador difere: `missing` pede preenchimento;
 * `unmappable`/`malformed` pedem correção do que já está lá; `check-digit-mismatch` é outra coisa —
 * o cadastro está COMPLETO e bem formado, mas o dígito não corresponde à conta. Dizer "corrija o
 * formato" aí manda o operador consertar o que já está certo.
 */
export type PayoutGapReason = 'missing' | 'unmappable' | 'malformed' | 'check-digit-mismatch'

export interface PayoutGap {
  field: PayoutField
  reason: PayoutGapReason
}

/**
 * Situação da linha no pré-voo:
 * - `ready` — entra na remessa;
 * - `blocked` — falta/está errado um dado do cadastro (ver `gaps`) — o operador corrige;
 * - `out-of-van` — a forma de pagamento não é coberta pela VAN; **nenhum cadastro resolve**;
 * - `not-found` — o id selecionado não existe mais (excluído entre a seleção e a conferência).
 * - `transmitted` — o título JÁ SAIU numa remessa anterior; nada a corrigir, e nada a reenviar.
 */
export type PreviewLineStatus =
  | 'ready'
  | 'blocked'
  | 'out-of-van'
  | 'not-found'
  | 'not-approved' // #736: falta APROVAR — distinto de `blocked`, que é falta de dado do cadastro
  // core-api#792/ADR-0065 §5: com o título passando a `Transmitido` na geração, o pré-voo deixou de
  // colapsar o estado e passou a nomeá-lo. É status PRÓPRIO, e não `blocked`, porque a ação do
  // operador é OPOSTA: `blocked` pede correção de cadastro; aqui não há o que corrigir — o pagamento
  // já foi ao banco. Enquanto caía no fallback de drift, a linha aparecia bloqueada e sem motivo, e o
  // operador procurava defeito num cadastro completo.
  | 'transmitted'
  // core-api#837 (PR #925, 01/09): o pré-voo e o emissor decidiam a aptidão por réguas diferentes —
  // o pré-voo aprovava lendo o DADO presente, o emissor recusava por não existir emissor para a rota,
  // e a divergência só aparecia no clique de gerar. Agora há régua única, e o backend NOMEIA o caso.
  //
  // Status PRÓPRIO, e não `blocked`, pela mesma razão do `transmitted` acima: a ação do operador é
  // outra. `blocked` pede correção de cadastro; aqui NÃO HÁ o que corrigir — o cadastro pode estar
  // completo e a rota simplesmente ainda não sai no arquivo. Sem esta entrada a linha cairia no
  // fallback de drift e apareceria vermelha e sem motivo.
  | 'no-issuer'

/**
 * UMA LINHA POR TÍTULO (core-api#794). A nota dá origem aos títulos, mas o ciclo de vida inteiro é do
 * TÍTULO: forma, vencimento e status são dele — inclusive nas retenções, que são títulos a pagar como
 * qualquer outro e podem ficar em aberto com o pai já pago.
 */
export interface RemittancePreviewLine {
  payableId: string
  /** A nota de origem. `null` em `not-found`: sem o título lido não há vínculo a declarar. */
  documentId: string | null
  status: PreviewLineStatus
  route: VanRoute | null
  gaps: readonly PayoutGap[]
  /** Valor DO TÍTULO — no filho de retenção não é o líquido da nota. */
  valueCents: string
}

/**
 * `blockedTotalCents` exclui o `out-of-van` de propósito (decisão do core-api): somá-los inflaria o número
 * que o operador usa para decidir se vale correr atrás do cadastro — e cadastro nenhum resolve câmbio.
 */
export interface RemittancePreview {
  lines: readonly RemittancePreviewLine[]
  readyCount: number
  blockedCount: number
  outOfVanCount: number
  notFoundCount: number
  notApprovedCount: number
  readyTotalCents: string
  blockedTotalCents: string
}

/** Entrada do pré-voo: TÍTULOS. O core-api aceita de 1 a 200 ids por chamada. */
export interface PreviewRemittanceInput {
  /**
   * ⚠️ OBRIGATÓRIO desde o core-api#804 — e é a MESMA conta que a geração recebe, de propósito: a
   * composição dos lotes depende de comparar o banco do favorecido com o do CEDENTE, então sem saber
   * qual conta paga não há pré-voo que confira o arquivo. O corpo lá é `.strict()`: mandar sem isto é 400.
   */
  cedenteAccountId: string
  payableIds: readonly string[]
}

/** Teto de ids por chamada, imposto pelo core-api (`remittancePreviewBodySchema`). */
export const REMITTANCE_PREVIEW_MAX_IDS = 200

// ── Geração (specs/101 S3) ──────────────────────────────────────────────────────
//
// ⚠️ A única operação do módulo que MOVE DINHEIRO. Gerar grava em `saida/` no bucket da VAN, e gravar ali
// É enfileirar pagamento no banco (ADR-0060 do core-api). Não existe "gerar para conferir" — quem confere
// é o pré-voo. Consome NSA (número que não volta) e PRENDE os documentos.

export interface GenerateRemittanceInput {
  /** Conta-cedente que PAGA. Precisa ter convênio; sem ele o core-api recusa. */
  cedenteAccountId: string
  /** TÍTULOS — mesma unidade do pré-voo e do grid: confere e gera sobre a mesma lista. */
  payableIds: readonly string[]
}

/**
 * O comprovante do operador. Enquanto não houver tela de acompanhamento, `nsa` + `fileName` são o único
 * registro de que a remessa saiu — por isso viajam inteiros até a UI.
 */
/** UM arquivo do lote — cada modalidade gera o seu, com NSA e objeto próprios. */
export interface GeneratedRemittanceFile {
  remittanceId: string
  fileName: string
  objectKey: string
  nsa: number
  totalCents: string
  lineCount: number
}

/**
 * ⚠️ MUDANÇA DE CONTRATO (core-api#929, 01/09/2026): a geração REPARTE a remessa em um arquivo por
 * MODALIDADE — boleto e transferência não cabem no mesmo lote —, e a resposta passou de um arquivo
 * para `{ files: [...] }`. Uma seleção mista produz mais de um, cada um com NSA, nome e objeto
 * próprios.
 *
 * O front ficou para trás e o preço foi alto: o `safeParse` recusava a forma nova e a tela dizia
 * "Algo deu errado" DEPOIS de o backend ter alocado o NSA e transmitido o título. Cada clique
 * queimava um número de sequência que não volta (NSA 5, 6 e 7 em 01/09).
 *
 * Pegar só o primeiro arquivo seria pior que o erro: o comprovante descreveria METADE do que foi
 * enfileirado, e o operador confirmaria acreditando ter conferido — o defeito que o pré-voo existe
 * para não cometer. Por isso o lote é a unidade, e a tela lista todos.
 */
export interface GeneratedRemittance {
  files: readonly GeneratedRemittanceFile[]
}

// ── Download do arquivo (specs/103) — HOMOLOGAÇÃO apenas ────────────────────────
//
// O core-api serve o OBJETO DO BUCKET, nunca uma regeração: regerar consumiria outro NSA e mudaria o
// carimbo de tempo, e arquivo parecido não é evidência de nada numa conferência de layout com o banco.
// A rota NÃO é registrada em produção (404 por ausência) — o arquivo carrega o cadastro bancário de
// todos os favorecidos do lote, e servir isso por HTTP em produção é exportação de dado de pagamento.

/**
 * O arquivo como cópia de conferência. `base64` porque a fronteira RPC é JSON (§III) — os bytes viram
 * Blob no browser, e o token nunca sai do server (§IX).
 */
export interface RemittanceFile {
  base64: string
  fileName: string
  /**
   * Prefixo de onde o objeto veio (`x-van-object-key`), quando o core-api informa. **`falhas/` significa
   * que o envio ao banco NÃO completou** — quem confere precisa saber disso antes de comparar bytes.
   */
  objectKey: string | null
}
