/**
 * Zod dos responses do core-api `/api/v2/financial` p/ Conciliação Bancária (boundary §IX). Valida o que
 * entra do backend antes de virar Model. Campos enum vêm como **string tolerante** — a tradução p/ os
 * literais do domínio acontece no mapper (`reconciliation.mappers.ts`), com fallback p/ drift. Money =
 * string de centavos; `entryType` é string LIVRE. Shapes verificados no PR #152. Espelha `financial.schema.ts`.
 */
import * as z from 'zod'

// Importar extrato (POST /bank-statements).
export const CoreApiImportSchema = z.object({
  statementId: z.string().trim(),
  imported: z.int(),
  duplicatesDiscarded: z.int(),
  period: z.object({ start: z.string().trim(), end: z.string().trim() }),
})

// Transação do extrato (GET /bank-statements/:id/transactions → { items }).
export const CoreApiTransactionSchema = z.object({
  id: z.string().trim(),
  fitid: z.string().trim(),
  date: z.string().trim(),
  movement: z.string().trim(), // 'Debit' | 'Credit'
  entryType: z.string().trim(), // LIVRE (passthrough OFX/CSV)
  payeeName: z.string().trim(),
  memo: z.string().trim(),
  valueCents: z.string().trim(),
  balanceAfterCents: z.string().trim(),
  reconciliationStatus: z.string().trim(), // 'Pending' | 'Reconciled' | 'ManualEntry'
})
export type CoreApiTransaction = z.infer<typeof CoreApiTransactionSchema>
export const CoreApiTransactionsSchema = z.object({ items: z.array(CoreApiTransactionSchema) })

// Título Pago (GET /payables?status=Paid → { items }). supplier/docNumber só quando #172 enriquecer.
export const CoreApiPaidPayableSchema = z.object({
  id: z.string().trim(),
  documentId: z.string().trim(),
  valueCents: z.string().trim(),
  dueDate: z.string().trim(), // date-only YYYY-MM-DD
  paymentMethod: z.string().trim(),
  supplierName: z.string().trim().nullable().catch(null),
  documentNumber: z.string().trim().nullable().catch(null),
})
export type CoreApiPaidPayable = z.infer<typeof CoreApiPaidPayableSchema>
export const CoreApiPaidPayablesSchema = z.object({ items: z.array(CoreApiPaidPayableSchema) })

// Sugestões (GET /statement-transactions/:id/suggestions → { suggestions }, NÃO items).
export const CoreApiSuggestionSchema = z.object({
  payableId: z.string().trim(),
  score: z.int(),
  band: z.string().trim(), // 'alta' | 'media'
  criteria: z.object({
    payeeMatch: z.boolean(),
    exactValue: z.boolean(),
    dateD0: z.boolean(),
    memoRef: z.boolean(),
    supplierOpenCount: z.int(),
  }),
})
export type CoreApiSuggestion = z.infer<typeof CoreApiSuggestionSchema>
export const CoreApiSuggestionsSchema = z.object({ suggestions: z.array(CoreApiSuggestionSchema) })

// Conciliar (POST /reconciliations).
export const CoreApiReconciliationCreatedSchema = z.object({
  reconciliationId: z.string().trim(),
  type: z.string().trim(), // 'Individual' | 'Multiple' | 'Partial'
  itemCount: z.int(),
})

// Desfazer (POST /reconciliations/:id/undo).
export const CoreApiUndoSchema = z.object({
  reconciliationId: z.string().trim(),
  status: z.string().trim(), // 'Undone'
})

// Lançamento manual (POST /statement-transactions/:id/manual-entry).
export const CoreApiManualEntrySchema = z.object({
  reconciliationId: z.string().trim(),
  type: z.string().trim(), // 'ManualEntry'
  manualEntryId: z.string().trim(),
})

// Lote (POST /reconciliations/batch).
export const CoreApiBatchSchema = z.object({
  created: z.int(),
  reconciliationIds: z.array(z.string().trim()),
  failed: z.array(z.object({ transactionId: z.string().trim(), error: z.string().trim() })),
})

// Fechar período (POST /reconciliation-periods/close).
export const CoreApiPeriodClosedSchema = z.object({
  periodId: z.string().trim(),
  status: z.string().trim(), // 'Closed'
})

// Rejeitar sugestão (POST /statement-transactions/:id/reject-suggestion).
export const CoreApiRejectSchema = z.object({
  transactionId: z.string().trim(),
  payableId: z.string().trim(),
})
