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
// #577: comprovante-fonte enviado JUNTO no create atômico (POST /documents/with-source-file). base64 dos
// bytes + mimeType na allowlist (pdf/xml). Ausente → create normal (POST /documents), sem anexo.
export interface SourceFileInput {
  fileName: string
  mimeType: 'application/pdf' | 'text/xml' | 'application/xml'
  base64: string
}

// Lançar Documento (POST /documents, asDraft:false → estado Aberto).
export interface CreateDocumentInput {
  // #534: RASCUNHO (asDraft) aceita estes 5 opcionais — o core-api reexige só p/ asDraft:false (superRefine).
  type?: DocumentType
  documentNumber?: string
  series?: string
  supplierRef?: string
  contractRef?: string
  budgetPlanRef?: string
  categoryRef?: string
  subcategoryRef?: string // #502 (S1): folha da árvore do plano — campo próprio (não mais dobrada em categoryRef)
  programRef?: string
  contaDebitoRef?: string // #197: conta-débito (conta-cedente) — a baixa é direcionada a ela
  accessKey?: string // #115: chave de acesso (44 dígitos) — obrigatória p/ DANFE no lançamento
  paymentDetail?: string // #273: complemento da forma de pagamento (linha digitável, id de cartão, ref de câmbio)
  competencia?: string // #197: competência (YYYY-MM) — opcional; validada por VO no domínio do backend
  paymentMethod?: PaymentMethod
  grossValueCents?: string
  sourceDiscountsCents?: string
  discountsCents?: string
  penaltyCents?: string
  interestCents?: string
  retentions: readonly RetentionInput[]
  registeredTaxes: readonly RegisteredTaxInput[]
  issueDate?: string // data de emissão (#163) — opcional em Rascunho e Aberto
  dueDate?: string // opcional p/ rascunho (asDraft); obrigatório no lançamento (gating na UI)
  description?: string
  asDraft?: boolean // true → Rascunho; default false → Aberto
  sourceFile?: SourceFileInput // #577: comprovante anexado no create atômico; ausente → sem anexo
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
  paymentDetail?: string | null // #273/#284: complemento da forma — editável no ajuste; null = limpar
}

// Aprovar / desfazer aprovação (POST /documents/:id/{approve,undo-approval}).
export interface ApproveInput {
  id: string
  version: number
}

// #270: vencimento de UM título ISOLADO (PATCH /documents/:id/payables/:payableId). NÃO propaga ao
// documento-pai nem aos irmãos (contrasta com o `adjust`/lote, que propagam). `dueDate` date-only YYYY-MM-DD.
export interface UpdatePayableDueDateInput {
  documentId: string
  payableId: string
  /**
   * ⚠️ Continua no contrato do core-api, mas NÃO protege mais esta escrita: desde o ADR-0063 de lá, o
   * reagendamento escreve pelo `PayableRepository` e não toca o documento — então a version do documento
   * não se move, e um lock que não se move sempre bate. Quem protege é o `expectedDueDate`.
   */
  version: number
  dueDate: string
  /**
   * Pré-condição do compare-and-swap: o vencimento que ESTAVA na tela quando o operador pediu a
   * alteração. O core-api só grava se o título ainda estiver com ele; senão devolve 409
   * (`payable-reschedule-conflict`).
   *
   * É obrigatório lá, de propósito — ausência cairia num CAS mais fraco sem nada dizer. Aqui sai do
   * `dueIso` da linha do grid, que é o vencimento CRU que o operador leu.
   */
  expectedDueDate: string
}

// Trilha de auditoria (GET /documents/:id/timeline). 5 eventos de domínio; `actor` = UUID do usuário (null =
// ação automática do sistema); `changes` = diff campo a campo. O BFF resolve `actor` → `actorName`.
export type TimelineEventType =
  | 'DocumentDraftSaved'
  | 'DocumentSaved'
  | 'PayableApproved'
  | 'ApprovalUndone'
  | 'PayableManuallyPaid'
  | 'PayableReconciled' // conciliação (agregado separado) — entra na trilha via core-api#406
  | 'ReconciliationUndone'
export interface TimelineChange {
  field: string
  before: string | null
  after: string | null
}
// Entrada CRUA do core-api (actor = UUID).
export interface DocumentTimelineEvent {
  eventType: TimelineEventType
  targetKind: 'Document' | 'Payable'
  targetId: string
  occurredAt: string // ISO-8601 com offset
  actor: string | null
  changes: readonly TimelineChange[]
}
// Entrada ENRIQUECIDA (o BFF resolve o nome do autor). `isSystem` = ação automática (actor era null);
// `actorName` null com `isSystem` false = autor humano não-resolvido (a View mostra "—", não "Sistema").
export interface DocumentTimelineEntry {
  eventType: TimelineEventType
  targetKind: 'Document' | 'Payable'
  targetId: string
  occurredAt: string
  isSystem: boolean
  actorName: string | null
  changes: readonly TimelineChange[]
}

// #224: baixa manual de UM título (Aprovado→Pago). `version` = do DOCUMENTO (optimistic lock do agregado).
// `paidAt` (#232) = data de pagamento (saída bancária, pode ser retroativa); ausente → backend usa now.
export interface ManualPaymentInput {
  documentId: string
  payableId: string
  version: number
  paidAt?: string
  reason?: string
}

// Cancelar (DELETE /documents/:id) — só em Aberto; hard-delete. `version` = optimistic lock (corpo).
export interface CancelInput {
  id: string
  version: number
}

// Listagem (GET /documents) — stub vazio na Fatia 1.
export interface ListDocumentsInput {
  status?: DocumentStatus
  supplierRef?: string
  type?: string
  dueFrom?: string
  dueTo?: string
  issuedFrom?: string // filtro por data de emissão (#163), janela inclusiva
  issuedTo?: string
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

// #62/Feature 2 (core-api#568): comprovante-fonte do documento. `url` = endpoint proxy que serve os bytes
// INLINE (nunca acessado direto pelo browser — o fetch atravessa a server-fn, §III/§IX). null = sem anexo.
export type DocumentAttachment = Readonly<{
  fileName: string
  mimeType: string
  sizeBytes: number
  url: string
}>

// Bytes do comprovante-fonte (base64) + mimeType — a server-fn os lê do core-api COM o token e devolve ao
// client, que monta o blob/File. O token nunca volta ao browser; a URL do core-api nunca é exposta.
export type DocumentSourceFile = Readonly<{ base64: string; mimeType: string }>

export type DocumentDetail = Readonly<{
  id: string
  status: DocumentStatus
  type: DocumentType | null
  documentNumber: string | null
  supplierRef: string | null
  paymentMethod: PaymentMethod | null
  paymentDetail: string | null // #273: complemento da forma de pagamento; null quando não informado
  competencia: string | null // #197: competência (YYYY-MM); null quando não informada
  grossValueCents: string | null
  netValueCents: string | null // null em Rascunho
  issueDate: string | null // YYYY-MM-DD (#163); null quando não informado
  dueDate: string | null // YYYY-MM-DD
  description: string | null
  // #95/#147 — categorização (refs que o GET /:id devolve; resolvidas p/ nome no client). null = não informado.
  budgetPlanRef: string | null
  categoryRef: string | null // categoria escolhida; #502(S1): docs novos = a CATEGORIA (não mais a folha)
  subcategoryRef: string | null // #502 (S1): folha da árvore do plano; null em docs antigos (folha vinha em categoryRef)
  costCenterRef: string | null
  programRef: string | null
  payables: readonly Payable[] // vazio em Rascunho
  version: number // optimistic lock — reenviado no PATCH (ajuste)
  // #568: comprovante-fonte (OCR); null = documento sem anexo (lançamento manual).
  attachment: DocumentAttachment | null
}>

// Item da lista — enriquecido pela 012/#47 (FIN-LIST-DTO): + série, bruto, forma de pagto, contrato, version.
export type DocumentSummary = Readonly<{
  id: string
  status: DocumentStatus
  documentNumber: string | null
  type: DocumentType | null
  supplierRef: string | null
  netValueCents: string | null
  issueDate: string | null // YYYY-MM-DD (#163); null quando não informado
  dueDate: string | null
  series: string | null
  grossValueCents: string | null
  paymentMethod: PaymentMethod | null
  contractRef: string | null
  version: number
}>

export type DocumentListResponse = Readonly<{
  items: readonly DocumentSummary[]
  page: number
  pageSize: number
  total: number
}>

// ── Listagem payable-centric (#201 — GET /financial/payable-titles): pai + filhos como linhas ──
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
  kind: PayableKind
  retentionType: RetentionType | null
  valueCents: string
  dueDate: string
  status: DocumentStatus
  supplierRef: string | null
  contractRef: string | null
  paidAt: string | null // data da baixa (core-api#231); null até pago
  // #229: derivados do documento pai (paridade com o grid por documento).
  issueDate: string | null
  paymentMethod: PaymentMethod | null
  version: number
  grossValueCents: string | null
  netValueCents: string | null
}>
export type PayableTitleListResponse = Readonly<{
  items: readonly PayableTitleItem[]
  page: number
  pageSize: number
  total: number
}>

// #536: contagem agregada por status (chips do grid) — 1 request no lugar de ~6. `byStatus` é o breakdown
// dos TÍTULOS (chave = status do backend: Open/Approved/Paid/Reconciled…); `draft` = documentos Rascunho.
export type PayableCountsInput = Readonly<{
  supplierRef?: string
  dueFrom?: string
  dueTo?: string
  type?: string
}>
export type PayableCounts = Readonly<{
  total: number
  draft: number
  byStatus: Readonly<Record<string, number>>
}>

// ── Widget "Últimos pagamentos" (042 — GET /financial/dashboard/recent-payments): Top-5 pagos ──
export interface RecentPayment {
  payableId: string
  documentId: string
  supplierRef: string | null
  debitAccountRef: string | null
  valueCents: string // STRING de centavos — formata na view
  paidAt: string | null // ISO YYYY-MM-DD
}
