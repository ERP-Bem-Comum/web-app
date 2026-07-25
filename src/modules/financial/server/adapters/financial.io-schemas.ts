/**
 * Zod de INPUT das server fns do Financeiro / Contas a Pagar (boundary §IX). Valida o que o client envia
 * antes de chamar o core-api. Money = string de CENTAVOS (`^\d+$`); datas `YYYY-MM-DD`; refs uuid;
 * `rateBps` int ≥ 0. Os asserts `_g_*` garantem schema ≡ tipo do domínio (`document.io.ts`). Espelha
 * `users.io-schemas.ts`.
 */
import * as z from 'zod'

import type * as D from '#modules/financial/server/domain/document.io.ts'

const DOCUMENT_TYPES = ['NFS-e', 'DANFE', 'RPA', 'Fatura', 'Boleto', 'Recibo', 'Imposto'] as const
const PAYMENT_METHODS = [
  'TED',
  'TransferenciaBancaria',
  'PIX',
  'Boleto',
  'CartaoCorporativo',
  'Cambio',
  'GuiaRecolhimento',
  'Outro',
] as const
const DOCUMENT_STATUSES = [
  'Rascunho',
  'Aberto',
  'Aprovado',
  'Transmitido',
  'Recusado',
  'Pago',
  'Conciliado',
] as const
const RETENTION_TYPES = ['ISS', 'IRRF', 'INSS', 'CSRF'] as const
const REGISTERED_TAX_TYPES = ['ICMS', 'IPI', 'PIS', 'COFINS', 'CBS', 'IBS_Municipal', 'IBS_Estadual'] as const

const CentsSchema = z.string().trim().regex(/^\d+$/)
const DateSchema = z.iso.date() // YYYY-MM-DD

const RetentionItemSchema = z.object({
  type: z.enum(RETENTION_TYPES),
  baseCents: CentsSchema,
  rateBps: z.int().min(0),
  valueCents: CentsSchema,
})

const RegisteredTaxItemSchema = z.object({
  type: z.enum(REGISTERED_TAX_TYPES),
  baseCents: CentsSchema,
  rateBps: z.int().min(0),
  valueCents: CentsSchema,
})

// Lançar Documento (POST /documents).
export const CreateDocumentInputSchema = z.object({
  // #534: RASCUNHO (asDraft) aceita estes 5 opcionais — o core-api reexige só p/ asDraft:false (superRefine).
  // O gating do lançamento Open é na UI (`canSubmit`); a borda espelha o contrato do backend.
  type: z.enum(DOCUMENT_TYPES).optional(),
  documentNumber: z.string().trim().min(1).max(60).optional(),
  series: z.string().trim().max(20).optional(),
  supplierRef: z.uuid().optional(),
  payeeKind: z.enum(['supplier', 'financier', 'act', 'collaborator']).optional(),
  approverRef: z.uuid().optional(),
  contractRef: z.uuid().optional(),
  budgetPlanRef: z.uuid().optional(),
  categoryRef: z.uuid().optional(),
  subcategoryRef: z.uuid().optional(), // #502 (S1): folha da árvore do plano — carimbo próprio no documento
  costCenterRef: z.uuid().optional(),
  programRef: z.uuid().optional(),
  contaDebitoRef: z.uuid().optional(), // #197: conta-débito (conta-cedente) — direciona a baixa
  accessKey: z.string().trim().min(1).max(64).optional(), // #115: chave de acesso (DANFE); core-api normaliza/valida 44 dígitos
  paymentDetail: z.string().trim().min(1).max(255).optional(), // #273: complemento da forma de pagamento
  competencia: z
    .string()
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(), // #197: competência YYYY-MM (VO no domínio do backend)
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  grossValueCents: CentsSchema.optional(),
  sourceDiscountsCents: CentsSchema.optional(),
  discountsCents: CentsSchema.optional(),
  penaltyCents: CentsSchema.optional(),
  interestCents: CentsSchema.optional(),
  retentions: z.array(RetentionItemSchema).readonly(),
  registeredTaxes: z.array(RegisteredTaxItemSchema).readonly(),
  issueDate: DateSchema.optional(), // data de emissão (#163) — opcional em Rascunho e Aberto
  dueDate: DateSchema.optional(), // opcional p/ rascunho; o lançamento exige (gating na UI)
  description: z.string().trim().max(500).optional(),
  asDraft: z.boolean().optional(), // true → Rascunho; default false → Aberto (core-api)
  // #577: comprovante anexado no create atômico (POST /documents/with-source-file). base64 dos bytes +
  // mimeType na allowlist (pdf/xml). Ausente → create normal. O tamanho/magic-bytes é validado no core-api.
  sourceFile: z
    .object({
      fileName: z.string().trim().min(1).max(255),
      mimeType: z.enum(['application/pdf', 'text/xml', 'application/xml']),
      base64: z.string().trim().min(1),
    })
    .optional(),
})

// Ajuste (PATCH /documents/:id).
export const AdjustDocumentInputSchema = z.object({
  id: z.uuid(),
  version: z.int().min(0),
  grossValueCents: CentsSchema.optional(),
  sourceDiscountsCents: CentsSchema.optional(),
  discountsCents: CentsSchema.optional(),
  penaltyCents: CentsSchema.optional(),
  interestCents: CentsSchema.optional(),
  retentions: z.array(RetentionItemSchema).readonly().optional(),
  dueDate: DateSchema.optional(),
  description: z.string().trim().max(500).nullable().optional(),
  paymentDetail: z.string().trim().min(1).max(255).nullable().optional(), // #284: editar o complemento; null = limpar
})

// Aprovar / desfazer aprovação (POST /documents/:id/{approve,undo-approval}).
export const ApproveInputSchema = z.object({
  id: z.uuid(),
  version: z.int().min(0),
})

// Cancelar (DELETE /documents/:id). `version` = optimistic lock exigido pelo core-api no corpo.
export const CancelInputSchema = z.object({ id: z.uuid(), version: z.int().min(0) })

// #270: vencimento de UM título ISOLADO (PATCH /documents/:id/payables/:payableId). `version` = optimistic
// lock; `dueDate` date-only. NÃO propaga pai↔filhos (é o ponto do endpoint).
export const UpdatePayableDueDateInputSchema = z.object({
  documentId: z.uuid(),
  payableId: z.uuid(),
  version: z.int().min(0),
  dueDate: DateSchema,
})

// #224: baixa manual de um título (POST /documents/:id/payables/:payableId/manual-payment).
export const ManualPaymentInputSchema = z.object({
  documentId: z.uuid(),
  payableId: z.uuid(),
  version: z.int().min(0),
  paidAt: DateSchema.optional(), // #232: data de pagamento (YYYY-MM-DD); ausente → backend usa now
  reason: z.string().trim().min(1).max(500).optional(),
})

// Listagem (GET /documents).
export const ListDocumentsInputSchema = z.object({
  status: z.enum(DOCUMENT_STATUSES).optional(),
  supplierRef: z.uuid().optional(),
  type: z.string().trim().optional(),
  dueFrom: DateSchema.optional(),
  dueTo: DateSchema.optional(),
  issuedFrom: DateSchema.optional(), // filtro por data de emissão (#163), janela inclusiva
  issuedTo: DateSchema.optional(),
  page: z.int().min(1).default(1),
  pageSize: z.int().min(1).max(100).default(20),
})

// #201: listagem por título (sem emissão; o endpoint filtra por status/tipo/fornecedor/vencimento).
// #536: input da contagem agregada (chips) — mesmos filtros da lista, sem status/paginação.
export const PayableCountsInputSchema = z.object({
  supplierRef: z.uuid().optional(),
  dueFrom: DateSchema.optional(),
  dueTo: DateSchema.optional(),
  type: z.string().trim().optional(), // documentType — o core-api valida o enum
})

export const ListPayableTitlesInputSchema = z.object({
  status: z.enum(DOCUMENT_STATUSES).optional(),
  type: z.string().trim().optional(),
  supplierRef: z.uuid().optional(),
  dueFrom: DateSchema.optional(),
  dueTo: DateSchema.optional(),
  page: z.int().min(1).default(1),
  pageSize: z.int().min(1).max(100).default(20),
})

// ── Guardas schema ≡ domínio (§IV/§VI) ──────────────────────────────────────────
type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const _g_create: AssertEqual<z.infer<typeof CreateDocumentInputSchema>, D.CreateDocumentInput> = true
const _g_adjust: AssertEqual<z.infer<typeof AdjustDocumentInputSchema>, D.AdjustDocumentInput> = true
const _g_approve: AssertEqual<z.infer<typeof ApproveInputSchema>, D.ApproveInput> = true
const _g_cancel: AssertEqual<z.infer<typeof CancelInputSchema>, D.CancelInput> = true
const _g_paydue: AssertEqual<
  z.infer<typeof UpdatePayableDueDateInputSchema>,
  D.UpdatePayableDueDateInput
> = true
const _g_manualpay: AssertEqual<z.infer<typeof ManualPaymentInputSchema>, D.ManualPaymentInput> = true
const _g_list: AssertEqual<z.infer<typeof ListDocumentsInputSchema>, D.ListDocumentsInput> = true
