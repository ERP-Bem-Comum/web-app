/**
 * Zod dos responses do core-api `/api/v2/financial` (boundary §IX). Valida o que entra do backend antes
 * de virar Model. Campos enum (`status`/`type`/`paymentMethod`/`kind`/`retentionType`) vêm como **string
 * tolerante** — a tradução para os literais do domínio acontece no mapper (`core-api-financial.ts`), com
 * fallback para drift (Fatia 1 tem só Draft/Open/Approved; o alvo são 7 estados). Money = string de centavos.
 */
import * as z from 'zod'

export const CoreApiPayableSchema = z.object({
  id: z.string().trim(),
  kind: z.string().trim(), // 'Parent' | 'Child'
  retentionType: z.string().trim().nullable(),
  valueCents: z.string().trim(),
  status: z.string().trim(),
})
export type CoreApiPayable = z.infer<typeof CoreApiPayableSchema>

// Detalhe (POST/PATCH/approve/undo-approval/GET :id).
export const CoreApiDocumentSchema = z.object({
  id: z.string().trim(),
  status: z.string().trim(),
  type: z.string().trim().nullable(),
  documentNumber: z.string().trim().nullable(),
  supplierRef: z.string().trim().nullable(),
  paymentMethod: z.string().trim().nullable(),
  paymentDetail: z.string().trim().nullable().catch(null), // #273 — drift-tolerante (backend antigo → null)
  grossValueCents: z.string().trim().nullable(),
  netValueCents: z.string().trim().nullable(),
  issueDate: z.string().trim().nullable().catch(null), // #163 — drift-tolerante (backend antigo → null)
  dueDate: z.string().trim().nullable(),
  description: z.string().trim().nullable(),
  payables: z.array(CoreApiPayableSchema),
  // Optimistic lock — necessário p/ o PATCH (ajuste). Tolerante a drift (Fatia 1 pode não enviar) → 0.
  version: z.int().min(0).catch(0),
})
export type CoreApiDocument = z.infer<typeof CoreApiDocumentSchema>

// Item da lista (DTO fino da Fatia 1).
export const CoreApiDocumentSummarySchema = z.object({
  id: z.string().trim(),
  status: z.string().trim(),
  documentNumber: z.string().trim().nullable(),
  type: z.string().trim().nullable(),
  supplierRef: z.string().trim().nullable(),
  netValueCents: z.string().trim().nullable(),
  dueDate: z.string().trim().nullable(),
  issueDate: z.string().trim().nullable().catch(null), // #163 — data de emissão no grid
  // Enriquecido pela 012/#47: campos locais do documento no grid de Contas a Pagar.
  series: z.string().trim().nullable().catch(null),
  grossValueCents: z.string().trim().nullable().catch(null),
  paymentMethod: z.string().trim().nullable().catch(null),
  contractRef: z.string().trim().nullable().catch(null),
  version: z.int().min(0).catch(0),
})
export type CoreApiDocumentSummary = z.infer<typeof CoreApiDocumentSummarySchema>

// Paginação flat (não harmonizada — { items, page, pageSize, total }).
export const CoreApiDocumentListSchema = z.object({
  items: z.array(CoreApiDocumentSummarySchema),
  page: z.int(),
  pageSize: z.int(),
  total: z.int(),
})
export type CoreApiDocumentList = z.infer<typeof CoreApiDocumentListSchema>

// #201: listagem payable-centric (GET /financial/payable-titles) — pai + filhos como linhas pagáveis.
export const CoreApiPayableTitleSchema = z.object({
  payableId: z.string().trim(),
  documentId: z.string().trim(),
  documentNumber: z.string().trim().nullable().catch(null),
  series: z.string().trim().nullable().catch(null),
  documentType: z.string().trim().nullable().catch(null),
  kind: z.string().trim(),
  retentionType: z.string().trim().nullable().catch(null),
  valueCents: z.string().trim(),
  dueDate: z.string().trim(),
  status: z.string().trim(),
  supplierRef: z.string().trim().nullable().catch(null),
  contractRef: z.string().trim().nullable().catch(null),
  // Data de pagamento (baixa). #231: date-only; null até pago. Match da conciliação: pagamento == saída.
  paidAt: z.string().trim().nullable().catch(null).optional(),
  // #229: paridade com o grid por documento (derivados do documento pai). Tolerantes (drift-safe).
  issueDate: z.string().trim().nullable().catch(null).optional(),
  paymentMethod: z.string().trim().nullable().catch(null).optional(),
  version: z.int().catch(0).optional(),
  grossValueCents: z.string().trim().nullable().catch(null).optional(),
  netValueCents: z.string().trim().nullable().catch(null).optional(),
})
export const CoreApiPayableTitleListSchema = z.object({
  items: z.array(CoreApiPayableTitleSchema),
  page: z.int(),
  pageSize: z.int(),
  total: z.int(),
})
export type CoreApiPayableTitleList = z.infer<typeof CoreApiPayableTitleListSchema>
