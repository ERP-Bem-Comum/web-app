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

// Conta-cedente (#138 — GET /cedente-accounts → array; GET /:id → objeto). Saldo corrente/pendências
// dependem do read-model #139 (não vêm aqui).
export const CoreApiCedenteAccountSchema = z.object({
  id: z.string().trim(),
  bankCode: z.string().trim(),
  bankName: z.string().trim().nullable().catch(null),
  type: z.string().trim().nullable().catch(null),
  agency: z.string().trim(),
  accountNumber: z.string().trim(),
  accountDigit: z.string().trim(),
  convenio: z.string().trim().catch(''),
  document: z.string().trim().catch(''),
  status: z.string().trim(),
  nickname: z.string().trim().nullable().catch(null),
  openingBalanceCents: z.string().trim().nullable().catch(null),
  openingBalanceDate: z.string().trim().nullable().catch(null),
})
export type CoreApiCedenteAccount = z.infer<typeof CoreApiCedenteAccountSchema>
export const CoreApiCedenteAccountsSchema = z.array(CoreApiCedenteAccountSchema)

// Read-model do extrato por conta+período (#139 — GET /cedente-accounts/:id/statement). Saldo corrente =
// closingBalanceCents; pendências = counters.pending; última atualização = data do último dia. Só os
// campos que o grid/hero consomem (lines não são necessárias aqui). counters são int (NÃO string).
export const CoreApiAccountStatementSchema = z.object({
  openingBalanceCents: z.string().trim().catch('0'),
  closingBalanceCents: z.string().trim(),
  counters: z.object({
    all: z.int().catch(0),
    in: z.int().catch(0),
    out: z.int().catch(0),
    reconciled: z.int().catch(0),
    pending: z.int(),
  }),
  days: z.array(z.object({ date: z.string().trim() })).catch([]),
})
export type CoreApiAccountStatement = z.infer<typeof CoreApiAccountStatementSchema>

// Breakdown ponderado de um critério (#140). criterion/result vêm como string tolerante (mapper traduz);
// `detail` opcional (só preenchido em supplierOpen). Ausente em backend antigo → o pai usa `.catch([])`.
export const CoreApiCriterionResultSchema = z.object({
  criterion: z.string().trim(), // 'exactValue'|'payeeMatch'|'dateD0'|'memoRef'|'supplierOpen'
  weight: z.int(),
  result: z.string().trim(), // 'ok'|'parcial'|'falha'
  detail: z.string().trim().catch(''),
})
export type CoreApiCriterionResult = z.infer<typeof CoreApiCriterionResultSchema>

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
  // #140 — vazio quando o backend não envia (drift); o mapper filtra critérios desconhecidos.
  criteriaBreakdown: z.array(CoreApiCriterionResultSchema).catch([]),
})
export type CoreApiSuggestion = z.infer<typeof CoreApiSuggestionSchema>
export const CoreApiSuggestionsSchema = z.object({ suggestions: z.array(CoreApiSuggestionSchema) })

// Palpite de topo por transação em lote (#174 — GET /bank-statements/:id/suggestions → { items }).
// topBand/topScore nulos quando a transação não é Pending ou não há candidato.
export const CoreApiStatementSuggestionSchema = z.object({
  transactionId: z.string().trim(),
  topBand: z.string().trim().nullable().catch(null), // 'alta' | 'media' | null
  topScore: z.int().nullable().catch(null),
})
export type CoreApiStatementSuggestion = z.infer<typeof CoreApiStatementSuggestionSchema>
export const CoreApiStatementSuggestionsSchema = z.object({
  items: z.array(CoreApiStatementSuggestionSchema),
})

// Conciliação ativa de uma transação (#175 — GET /statement-transactions/:id/reconciliation). `id` é o
// reconciliationId. `treatment` da diferença NÃO é serializado pelo core-api hoje (só differenceCents).
export const CoreApiTransactionReconciliationSchema = z.object({
  id: z.string().trim(),
  transactionId: z.string().trim(),
  type: z.string().trim(), // 'Individual' | 'Multiple' | 'Partial' | 'ManualEntry'
  status: z.string().trim(), // 'Active' | 'Undone' (lookup só devolve Active)
  reconciledBy: z.string().trim(),
  reconciledAt: z.string().trim(), // ISO datetime
  differenceCents: z.string().trim().nullable().catch(null),
  items: z
    .array(z.object({ payableId: z.string().trim(), reconciledValueCents: z.string().trim() }))
    .catch([]),
})
export type CoreApiTransactionReconciliation = z.infer<typeof CoreApiTransactionReconciliationSchema>

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

// Período de conciliação (#173 — GET /reconciliation-periods → array). `id` = periodId p/ exportar.
export const CoreApiReconciliationPeriodSchema = z.object({
  id: z.string().trim(),
  debitAccountRef: z.string().trim(),
  periodStart: z.string().trim(), // date-only YYYY-MM-DD
  periodEnd: z.string().trim(),
  status: z.string().trim(), // 'Open' | 'Closed'
  closedAt: z.string().trim().nullable().catch(null),
  closedBy: z.string().trim().nullable().catch(null),
})
export type CoreApiReconciliationPeriod = z.infer<typeof CoreApiReconciliationPeriodSchema>
export const CoreApiReconciliationPeriodsSchema = z.array(CoreApiReconciliationPeriodSchema)

// Rejeitar sugestão (POST /statement-transactions/:id/reject-suggestion).
export const CoreApiRejectSchema = z.object({
  transactionId: z.string().trim(),
  payableId: z.string().trim(),
})

// Referências da categorização (020 · #200/#147) — respostas são ARRAY NU (não {items}).
// `group` tolerante (string) p/ drift; o mapper normaliza. `parentId` nullable (subcategoria).
export const CoreApiCategorySchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  group: z.string().trim(),
  parentId: z.string().trim().nullable().catch(null),
})
export const CoreApiCategoriesSchema = z.array(CoreApiCategorySchema)
export const CoreApiCostCenterSchema = z.object({
  id: z.string().trim(),
  code: z.string().trim(),
  name: z.string().trim(),
})
export const CoreApiCostCentersSchema = z.array(CoreApiCostCenterSchema)
