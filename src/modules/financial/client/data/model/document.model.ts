/**
 * Model do client (client-data) — tipos de I/O do repository do Financeiro, espelhando `document.io.ts`.
 * Tipos locais (não importa server/domain — boundary §I). Money = string de centavos; alíquota = bps.
 */

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
export type DocumentStatus =
  | 'Rascunho'
  | 'Aberto'
  | 'Aprovado'
  | 'Transmitido'
  | 'Recusado'
  | 'Pago'
  | 'Conciliado'
export type RetentionType = 'ISS' | 'IRRF' | 'INSS' | 'CSRF'
export type RegisteredTaxType = 'ICMS' | 'IPI' | 'PIS' | 'COFINS' | 'CBS' | 'IBS_Municipal' | 'IBS_Estadual'
export type PayableKind = 'Parent' | 'Child'

// ── Itens de imposto (entrada) ──
export type RetentionInput = Readonly<{
  type: RetentionType
  baseCents: string
  rateBps: number
  valueCents: string
}>
export type RegisteredTaxInput = Readonly<{
  type: RegisteredTaxType
  baseCents: string
  rateBps: number
  valueCents: string
}>

// ── Inputs enviados pelo repository (a server fn valida no server) ──
export type CreateDocumentInput = Readonly<{
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
  dueDate?: string // opcional p/ rascunho (asDraft); obrigatório no lançamento (gating na UI)
  description?: string
  asDraft?: boolean // true → Rascunho (campos opcionais, sem títulos); default false → Aberto
}>

export type AdjustDocumentInput = Readonly<{
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
}>

export type ApproveInput = Readonly<{ id: string; version: number }>
export type CancelInput = Readonly<{ id: string }>

export type ListDocumentsInput = Readonly<{
  status?: DocumentStatus
  supplierRef?: string
  type?: string
  dueFrom?: string
  dueTo?: string
  page: number
  pageSize: number
}>

// ── Outputs (Model que a UI consome) ──
export type Payable = Readonly<{
  id: string
  kind: PayableKind
  retentionType: RetentionType | null
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
  netValueCents: string | null
  dueDate: string | null
  description: string | null
  payables: readonly Payable[]
  version: number // optimistic lock — reenviado no PATCH (ajuste)
}>

export type DocumentSummary = Readonly<{
  id: string
  status: DocumentStatus
  documentNumber: string | null
  type: DocumentType | null
  supplierRef: string | null
  // Fornecedor resolvido no backend via read-model (#47 US2); nulos por consistência eventual.
  supplierName: string | null
  supplierDocument: string | null
  netValueCents: string | null
  // Enriquecido pela 012/#47 (FIN-LIST-DTO): série, bruto, forma de pagamento, contrato, version.
  series: string | null
  grossValueCents: string | null
  paymentMethod: PaymentMethod | null
  contractRef: string | null
  version: number
  dueDate: string | null
}>

export type DocumentListResponse = Readonly<{
  items: readonly DocumentSummary[]
  page: number
  pageSize: number
  total: number
}>
