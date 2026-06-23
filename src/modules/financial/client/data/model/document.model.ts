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
// Tipo do favorecido (#90) — espelha o enum do core-api; mesmos valores do PartnerKind do front.
export type PayeeKind = 'supplier' | 'financier' | 'act' | 'collaborator'

export type CreateDocumentInput = Readonly<{
  type: DocumentType
  documentNumber: string
  series?: string
  supplierRef: string
  payeeKind?: PayeeKind // tipo do favorecido (#90) — derivado do parceiro; backend default 'supplier'
  approverRef?: string // aprovador escolhido (#148) — UUID de usuário com payable:approve
  contractRef?: string
  budgetPlanRef?: string
  categoryRef?: string
  costCenterRef?: string // centro de custo (#147) — backend aceita no documento (corrige drift do schema)
  programRef?: string
  paymentMethod: PaymentMethod
  grossValueCents: string
  sourceDiscountsCents?: string
  discountsCents?: string
  penaltyCents?: string
  interestCents?: string
  retentions: readonly RetentionInput[]
  registeredTaxes: readonly RegisteredTaxInput[]
  issueDate?: string // data de emissão (#163) — opcional em Rascunho e Aberto
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
export type CancelInput = Readonly<{ id: string; version: number }>

export type ListDocumentsInput = Readonly<{
  status?: DocumentStatus
  supplierRef?: string
  type?: string
  dueFrom?: string
  dueTo?: string
  issuedFrom?: string // filtro por data de emissão (#163), janela inclusiva
  issuedTo?: string
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
  issueDate: string | null // YYYY-MM-DD (#163); null quando não informado
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
  netValueCents: string | null
  // Enriquecido pela 012/#47 (FIN-LIST-DTO): série, bruto, forma de pagamento, contrato, version.
  series: string | null
  grossValueCents: string | null
  paymentMethod: PaymentMethod | null
  contractRef: string | null
  version: number
  dueDate: string | null
  issueDate: string | null // YYYY-MM-DD (#163); null quando não informado
}>

export type DocumentListResponse = Readonly<{
  items: readonly DocumentSummary[]
  page: number
  pageSize: number
  total: number
}>

// ── Listagem payable-centric (#201 — grid por TÍTULO: pai + filhos como linhas) ──
export type ListPayableTitlesInput = Readonly<{
  status?: DocumentStatus
  type?: string
  supplierRef?: string
  dueFrom?: string
  dueTo?: string
  page: number
  pageSize: number
}>
export type PayableTitleItem = Readonly<{
  payableId: string
  documentId: string
  documentNumber: string | null
  series: string | null
  type: DocumentType | null
  kind: PayableKind // Parent (líquido) | Child (retenção)
  retentionType: RetentionType | null
  valueCents: string
  dueDate: string
  status: DocumentStatus
  supplierRef: string | null
  contractRef: string | null
}>
export type PayableTitleListResponse = Readonly<{
  items: readonly PayableTitleItem[]
  page: number
  pageSize: number
  total: number
}>
