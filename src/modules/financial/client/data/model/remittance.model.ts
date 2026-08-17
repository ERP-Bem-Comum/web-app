/**
 * Model do client (client-data) — pré-voo da remessa da VAN, espelhando `server/domain/remittance.io.ts`.
 * Tipos LOCAIS (não importa server/domain — boundary §I). Money = string de centavos.
 *
 * Só o PRÉ-VOO vive aqui: leitura pura, que não consome NSA nem toca no bucket da VAN. A geração (que
 * grava em `saida/` e portanto ENFILEIRA PAGAMENTO — ADR-0060 do core-api) é outra fatia.
 */

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
