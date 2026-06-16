/**
 * Financeiro / Contas a Pagar — tipos de I/O do domínio (PUROS, sem Zod — §VI). Os schemas Zod vivem na
 * borda (`../adapters/financial.io-schemas.ts` e `../adapters/core-api/financial.schema.ts`). Alinhado ao
 * contrato REAL do core-api (`/api/v2/financial`, Fatia 1) e à doc revisada (`FIN-DOCUMENTO-INGESTAO`).
 * Dinheiro trafega como **string de CENTAVOS** na borda; alíquota como **basis points** (11% = 1100).
 */

// ── Enums (uniões de literais — §VI) ────────────────────────────────────────────
export type DocumentType = 'NFS-e' | 'DANFE' | 'RPA' | 'Fatura' | 'Boleto' | 'Recibo' | 'Imposto'

export type PaymentMethod =
  | 'TED'
  | 'TransferenciaBancaria'
  | 'PIX'
  | 'Boleto'
  | 'CartaoCorporativo'
  | 'Cambio'
  | 'GuiaRecolhimento'
  | 'Outro'

// Alvo (7 estados); vivos na Fatia 1 = Rascunho | Aberto | Aprovado.
export type DocumentStatus =
  | 'Rascunho'
  | 'Aberto'
  | 'Aprovado'
  | 'Transmitido'
  | 'Recusado'
  | 'Pago'
  | 'Conciliado'

export type RetentionType = 'ISS' | 'IRRF' | 'INSS' | 'CSRF' // abate do líquido + gera título filho
export type RegisteredTaxType = 'ICMS' | 'IPI' | 'PIS' | 'COFINS' | 'CBS' | 'IBS_Municipal' | 'IBS_Estadual' // só registro: não abate, não gera filho

export type PayableKind = 'Parent' | 'Child'

// ── Itens de imposto (entrada) ──────────────────────────────────────────────────
export interface RetentionInput {
  type: RetentionType
  baseCents: string
  rateBps: number
  valueCents: string
}

export interface RegisteredTaxInput {
  type: RegisteredTaxType
  baseCents: string
  rateBps: number
  valueCents: string
}

// ── Inputs (validados na server fn pelos schemas em adapters) ───────────────────
// Lançar Documento (POST /documents, asDraft:false → estado Aberto).
export interface CreateDocumentInput {
  type: DocumentType
  documentNumber: string
  series?: string
  supplierRef: string
  contractRef?: string
  budgetPlanRef?: string
  categoryRef?: string
  programRef?: string
  paymentMethod: PaymentMethod
  grossValueCents: string
  sourceDiscountsCents?: string
  discountsCents?: string
  penaltyCents?: string
  interestCents?: string
  retentions: readonly RetentionInput[]
  registeredTaxes: readonly RegisteredTaxInput[]
  dueDate: string
  description?: string
}

// Ajuste (PATCH /documents/:id) — só em Aberto; ≥1 campo além de version; regenera filhos.
export interface AdjustDocumentInput {
  id: string
  version: number
  grossValueCents?: string
  sourceDiscountsCents?: string
  discountsCents?: string
  penaltyCents?: string
  interestCents?: string
  retentions?: readonly RetentionInput[]
  dueDate?: string
  description?: string | null
}

// Aprovar / desfazer aprovação (POST /documents/:id/{approve,undo-approval}).
export interface ApproveInput {
  id: string
  version: number
}

// Cancelar (DELETE /documents/:id) — só em Aberto; hard-delete.
export interface CancelInput {
  id: string
}

// Listagem (GET /documents) — stub vazio na Fatia 1.
export interface ListDocumentsInput {
  status?: DocumentStatus
  supplierRef?: string
  type?: string
  dueFrom?: string
  dueTo?: string
  page: number
  pageSize: number
}

// ── Outputs (Model que a UI consome) ────────────────────────────────────────────
export type Payable = Readonly<{
  id: string
  kind: PayableKind
  retentionType: RetentionType | null // null no pai
  valueCents: string
  status: DocumentStatus
}>

export type DocumentDetail = Readonly<{
  id: string
  status: DocumentStatus
  type: DocumentType | null
  documentNumber: string | null
  supplierRef: string | null
  paymentMethod: PaymentMethod | null
  grossValueCents: string | null
  netValueCents: string | null // null em Rascunho
  dueDate: string | null // YYYY-MM-DD
  description: string | null
  payables: readonly Payable[] // vazio em Rascunho
}>

// Item da lista (DTO fino da Fatia 1 — será enriquecido por core-api#47 FIN-LIST-DTO).
export type DocumentSummary = Readonly<{
  id: string
  status: DocumentStatus
  documentNumber: string | null
  type: DocumentType | null
  supplierRef: string | null
  netValueCents: string | null
  dueDate: string | null
}>

export type DocumentListResponse = Readonly<{
  items: readonly DocumentSummary[]
  page: number
  pageSize: number
  total: number
}>
