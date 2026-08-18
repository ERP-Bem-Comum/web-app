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
 * `unmappable`/`malformed` pedem correção do que já está lá.
 */
export type PayoutGapReason = 'missing' | 'unmappable' | 'malformed'

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
export type PreviewLineStatus = 'ready' | 'blocked' | 'out-of-van' | 'not-found'

export interface RemittancePreviewLine {
  documentId: string
  status: PreviewLineStatus
  route: VanRoute | null
  gaps: readonly PayoutGap[]
  netValueCents: string
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
  readyTotalCents: string
  blockedTotalCents: string
}

/** Entrada do pré-voo. O core-api aceita de 1 a 200 ids por chamada. */
export interface PreviewRemittanceInput {
  documentIds: readonly string[]
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
  documentIds: readonly string[]
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
