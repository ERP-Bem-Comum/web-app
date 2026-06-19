/**
 * Zod de INPUT das server fns da Conciliação Bancária (boundary §IX). Valida o que o client envia antes
 * de chamar o core-api. Money de título = string de CENTAVOS; `difference.valueCents` é int (pode
 * negativo); datas `YYYY-MM-DD`; refs uuid. Os asserts `_g_*` garantem schema ≡ tipo do domínio
 * (`reconciliation.io.ts`). Espelha `financial.io-schemas.ts`.
 */
import * as z from 'zod'

import type * as R from '#modules/financial/server/domain/reconciliation.io.ts'

const STATEMENT_FORMATS = ['OFX', 'CSV'] as const
const DIFFERENCE_TREATMENTS = ['Interest', 'Penalty', 'Discount', 'Fee', 'Partial'] as const
const MANUAL_ENTRY_TYPES = [
  'Payment',
  'Receipt',
  'Transfer',
  'FeePenaltyInterest',
  'Investment',
  'Redemption',
] as const

const DateSchema = z.iso.date() // YYYY-MM-DD

export const ImportStatementInputSchema = z.object({
  debitAccountRef: z.uuid(),
  format: z.enum(STATEMENT_FORMATS),
  content: z.string().trim().min(1),
  fileName: z.string().trim().min(1).max(255).optional(),
})

export const ListTransactionsInputSchema = z.object({ statementId: z.uuid() })

export const GetCedenteAccountInputSchema = z.object({ id: z.uuid() })

export const GetSuggestionsInputSchema = z.object({ transactionId: z.uuid() })

export const RejectSuggestionInputSchema = z.object({ transactionId: z.uuid(), payableId: z.uuid() })

const DifferenceInputSchema = z.object({
  valueCents: z.int(), // pode ser negativo (ex.: Discount)
  treatment: z.enum(DIFFERENCE_TREATMENTS),
})

export const CreateReconciliationInputSchema = z.object({
  transactionId: z.uuid(),
  payableIds: z.array(z.uuid()).min(1).max(100).readonly(),
  difference: DifferenceInputSchema.optional(),
})

export const UndoReconciliationInputSchema = z.object({
  reconciliationId: z.uuid(),
  reason: z.string().trim().max(500).optional(),
})

const ManualEntryTemplateSchema = z.object({
  type: z.enum(MANUAL_ENTRY_TYPES),
  supplierRef: z.uuid().optional(),
  categoryRef: z.uuid().optional(),
  costCenterRef: z.uuid().optional(),
  programRef: z.uuid().optional(),
  description: z.string().trim().max(500).optional(),
  destinationAccount: z.uuid().optional(),
})

export const ManualEntryInputSchema = ManualEntryTemplateSchema.extend({ transactionId: z.uuid() })

export const BatchReconcileInputSchema = z.object({
  transactionIds: z.array(z.uuid()).min(1).max(500).readonly(),
  template: ManualEntryTemplateSchema,
})

export const ClosePeriodInputSchema = z.object({
  debitAccountRef: z.uuid(),
  periodStart: DateSchema,
  periodEnd: DateSchema,
})

// ── Guardas schema ≡ domínio (§IV/§VI) ──────────────────────────────────────────
type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const _g_import: AssertEqual<z.infer<typeof ImportStatementInputSchema>, R.ImportStatementInput> = true
const _g_listTx: AssertEqual<z.infer<typeof ListTransactionsInputSchema>, R.ListTransactionsInput> = true
const _g_sugg: AssertEqual<z.infer<typeof GetSuggestionsInputSchema>, R.GetSuggestionsInput> = true
const _g_reject: AssertEqual<z.infer<typeof RejectSuggestionInputSchema>, R.RejectSuggestionInput> = true
const _g_recon: AssertEqual<
  z.infer<typeof CreateReconciliationInputSchema>,
  R.CreateReconciliationInput
> = true
const _g_undo: AssertEqual<z.infer<typeof UndoReconciliationInputSchema>, R.UndoReconciliationInput> = true
const _g_manual: AssertEqual<z.infer<typeof ManualEntryInputSchema>, R.ManualEntryInput> = true
const _g_batch: AssertEqual<z.infer<typeof BatchReconcileInputSchema>, R.BatchReconcileInput> = true
const _g_close: AssertEqual<z.infer<typeof ClosePeriodInputSchema>, R.ClosePeriodInput> = true

void _g_import
void _g_listTx
void _g_sugg
void _g_reject
void _g_recon
void _g_undo
void _g_manual
void _g_batch
void _g_close
