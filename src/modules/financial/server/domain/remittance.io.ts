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
 */
export type PreviewLineStatus = 'ready' | 'blocked' | 'out-of-van' | 'not-found' | 'not-approved' // #736: falta APROVAR — distinto de `blocked`, que é falta de dado do cadastro

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
export interface GeneratedRemittance {
  remittanceId: string
  fileName: string
  objectKey: string
  nsa: number
  totalCents: string
  lineCount: number
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
