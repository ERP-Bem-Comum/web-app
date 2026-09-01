/**
 * Model do client (client-data) — pré-voo da remessa da VAN, espelhando `server/domain/remittance.io.ts`.
 * Tipos LOCAIS (não importa server/domain — boundary §I). Money = string de centavos.
 *
 * Cobre o PRÉ-VOO (leitura pura) e a GERAÇÃO (que grava em `saida/` e portanto ENFILEIRA PAGAMENTO no
 * banco — ADR-0060 do core-api).
 */
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

export type VanRoute = 'pix' | 'transfer' | 'billet' | 'tax-guide'

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

export type PreviewLineStatus =
  | 'ready'
  | 'blocked'
  | 'out-of-van'
  | 'not-found'
  | 'not-approved' // #736: falta APROVAR — distinto de `blocked` (falta dado do cadastro)
  // core-api#792/ADR-0065 §5: o título JÁ SAIU numa remessa. Status próprio, e não `blocked`, porque a
  // ação é oposta — `blocked` pede correção de cadastro; aqui não há o que corrigir nem o que reenviar.
  | 'transmitted'
  // core-api#837 (PR #925, 01/09): régua única entre pré-voo e emissor. A rota não tem emissor no
  // CNAB — o cadastro pode estar COMPLETO e ainda assim a linha não sai. Status próprio pela mesma
  // razão do `transmitted`: `blocked` mandaria corrigir algo que não está errado.
  | 'no-issuer'

/**
 * UMA LINHA POR TÍTULO (core-api#794). A nota dá origem aos títulos, mas o ciclo de vida inteiro é do
 * TÍTULO — forma, vencimento e status são dele, inclusive nas retenções, que são títulos a pagar como
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

export interface PreviewRemittanceInput {
  /**
   * ⚠️ A conta que PAGA — obrigatória desde o core-api#794/#804, e a MESMA da geração: a repartição dos
   * lotes se decide comparando o banco do favorecido com o do cedente. Sem ela o pré-voo volta 400.
   */
  cedenteAccountId: string
  payableIds: readonly string[]
}

// ── Geração (specs/101 S3) ──────────────────────────────────────────────────────
// ⚠️ MOVE DINHEIRO: gravar em `saida/` é enfileirar pagamento no banco (ADR-0060 do core-api).

export interface GenerateRemittanceInput {
  cedenteAccountId: string
  /** TÍTULOS — mesma unidade do pré-voo e do grid. */
  payableIds: readonly string[]
}

/** Comprovante do operador. Sem tela de acompanhamento, `nsa` + `fileName` são o único registro. */
/** UM arquivo do lote. core-api#929: a geração reparte por MODALIDADE. */
export interface GeneratedRemittanceFile {
  remittanceId: string
  fileName: string
  objectKey: string
  nsa: number
  totalCents: string
  lineCount: number
}

/**
 * O LOTE. Espelha `server/domain/remittance.io.ts` — ver lá o porquê de a unidade ser o lote e não o
 * arquivo, e o custo que a divergência de contrato cobrou em 01/09 (NSA queimado a cada clique).
 */
export interface GeneratedRemittance {
  files: readonly GeneratedRemittanceFile[]
}

/**
 * Falha da geração: tag (§V — dirige o COMPORTAMENTO) + a mensagem PT-BR do core-api (dirige o TEXTO).
 * Quatro recusas distintas chegam como o mesmo 422; só o texto as separa.
 */
export interface FinancialFailure {
  error: FinancialError
  message: string | null
}

// ── Download do arquivo (specs/103) — HOMOLOGAÇÃO apenas ────────────────────────

/**
 * Cópia do arquivo para conferir layout com o banco. `base64` porque a fronteira RPC é JSON — o Blob é
 * montado no browser (§IX: o token nunca sai do server).
 *
 * `objectKey` é o prefixo de onde o objeto veio: **`falhas/` significa que o envio NÃO completou**, e
 * quem for comparar bytes com o banco precisa saber disso antes. `null` quando o backend não informa.
 */
export interface RemittanceFile {
  base64: string
  fileName: string
  objectKey: string | null
}
