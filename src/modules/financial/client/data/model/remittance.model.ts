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

export type PayoutGapReason = 'missing' | 'unmappable' | 'malformed'

export interface PayoutGap {
  field: PayoutField
  reason: PayoutGapReason
}

export type PreviewLineStatus = 'ready' | 'blocked' | 'out-of-van' | 'not-found'

export interface RemittancePreviewLine {
  documentId: string
  status: PreviewLineStatus
  route: VanRoute | null
  gaps: readonly PayoutGap[]
  netValueCents: string
}

export interface RemittancePreview {
  lines: readonly RemittancePreviewLine[]
  readyCount: number
  blockedCount: number
  outOfVanCount: number
  notFoundCount: number
  readyTotalCents: string
  blockedTotalCents: string
}

export interface PreviewRemittanceInput {
  documentIds: readonly string[]
}

// ── Geração (specs/101 S3) ──────────────────────────────────────────────────────
// ⚠️ MOVE DINHEIRO: gravar em `saida/` é enfileirar pagamento no banco (ADR-0060 do core-api).

export interface GenerateRemittanceInput {
  cedenteAccountId: string
  documentIds: readonly string[]
}

/** Comprovante do operador. Sem tela de acompanhamento, `nsa` + `fileName` são o único registro. */
export interface GeneratedRemittance {
  remittanceId: string
  fileName: string
  objectKey: string
  nsa: number
  totalCents: string
  lineCount: number
}

/**
 * Falha da geração: tag (§V — dirige o COMPORTAMENTO) + a mensagem PT-BR do core-api (dirige o TEXTO).
 * Quatro recusas distintas chegam como o mesmo 422; só o texto as separa.
 */
export interface GenerateRemittanceFailure {
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
