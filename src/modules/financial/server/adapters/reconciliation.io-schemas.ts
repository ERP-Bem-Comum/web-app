/**
 * Zod de INPUT das server fns da Conciliação Bancária (boundary §IX). Valida o que o client envia antes
 * de chamar o core-api. Money de título = string de CENTAVOS; `difference.valueCents` é int (pode
 * negativo); datas `YYYY-MM-DD`; refs uuid. Os asserts `_g_*` garantem schema ≡ tipo do domínio
 * (`reconciliation.io.ts`). Espelha `financial.io-schemas.ts`.
 */
import * as z from 'zod'

import type * as R from '#modules/financial/server/domain/reconciliation.io.ts'

const STATEMENT_FORMATS = ['OFX', 'CSV', 'PDF'] as const // PDF: OCR (core-api#557); content = base64
const DIFFERENCE_TREATMENTS = ['Interest', 'Penalty', 'Discount', 'Fee', 'Partial'] as const
const MANUAL_ENTRY_TYPES = [
  'Payment',
  'Receipt',
  'Transfer',
  'FeePenaltyInterest',
  'Investment',
  'Redemption',
] as const
// #370: mesmos DocumentType do sistema (espelha `documentTypeSchema` do core-api). Só p/ os campos de
// documento do lançamento manual (Pagamento/Recebimento).
const DOCUMENT_TYPES = ['NFS-e', 'DANFE', 'RPA', 'Fatura', 'Boleto', 'Recibo', 'Imposto'] as const

const DateSchema = z.iso.date() // YYYY-MM-DD

export const ImportStatementInputSchema = z.object({
  debitAccountRef: z.uuid(),
  format: z.enum(STATEMENT_FORMATS),
  // Texto cru (OFX/CSV) ou base64 (PDF). Teto espelha o core-api (5_000_000 chars) — base64 infla ~33%,
  // então um PDF de ~3.7MB cabe. Rejeita cedo, com erro amigável, antes de subir.
  content: z.string().trim().min(1).max(5_000_000),
  fileName: z.string().trim().min(1).max(255).optional(),
})

export const ListTransactionsInputSchema = z.object({ statementId: z.uuid() })

// Excluir extrato (DELETE /bank-statements/:id — core-api#558). Só o id; sem body.
export const DeleteStatementInputSchema = z.object({ statementId: z.uuid() })

export const GetCedenteAccountInputSchema = z.object({ id: z.uuid() })
// Encerrar conta-cedente (POST /cedente-accounts/:id/close) — só o id; sem body.
export const CloseCedenteAccountInputSchema = z.object({ id: z.uuid() })
// Editar conta-cedente (PATCH /cedente-accounts/:id) — campos editáveis opcionais (CNPJ/saldo são imutáveis).
export const EditCedenteAccountInputSchema = z.object({
  id: z.uuid(),
  bankCode: z.string().trim().min(1).max(10).optional(),
  bankName: z.string().trim().min(1).max(120).optional(),
  type: z.enum(['Corrente', 'Poupanca', 'Investimento', 'Cartao', 'Outro']).optional(),
  typeLabel: z.string().trim().min(1).max(120).optional(),
  agency: z.string().trim().min(1).max(10).optional(),
  accountNumber: z.string().trim().min(1).max(20).optional(),
  accountDigit: z.string().trim().max(2).optional(),
  nickname: z.string().trim().min(1).max(120).optional(),
  // #722: preenchível quando AUSENTE — a conta cadastrada sem convênio passa a gerar remessa. Trocar
  // um já preenchido é recusado no core-api (`cedente-convenio-already-set`); o front não envia.
  // `min(1)` espelha o contrato de lá: string vazia não é "limpar", é campo inválido.
  // 6, não 20: o campo do header CNAB tem 6 posições (033-038) e o banco trunca o excedente em
  // silêncio. Ver CONVENIO_MAX_DIGITS e core-api#804.
  convenio: z.string().trim().min(1).max(6).optional(),
})

// #205: extrato por período. `from`/`to` date-only (YYYY-MM-DD); filter opcional.
export const GetAccountStatementInputSchema = z.object({
  accountId: z.uuid(),
  from: z.string().trim(),
  to: z.string().trim(),
  filter: z.enum(['all', 'in', 'out', 'reconciled', 'pending']).optional(),
})

export const CreateCedenteAccountInputSchema = z.object({
  bankCode: z.string().trim().min(1).max(10),
  bankName: z.string().trim().min(1).max(120).optional(),
  type: z.enum(['Corrente', 'Poupanca', 'Investimento', 'Cartao', 'Outro']),
  typeLabel: z.string().trim().min(1).max(120).optional(), // #206: texto livre p/ Cartao/Outro
  agency: z.string().trim().min(1).max(10),
  accountNumber: z.string().trim().min(1).max(20),
  accountDigit: z.string().trim().max(2),
  document: z.string().trim().min(1).max(18),
  nickname: z.string().trim().min(1).max(120).optional(),
  openingBalanceCents: z.string().trim().optional(),
  openingBalanceDate: z.string().trim().optional(),
  // #722: OPCIONAL no cadastro — a conta serve à conciliação sem convênio. Só a remessa o exige.
  // 6, não 20 — ver o comentário no schema de edição.
  convenio: z.string().trim().max(6).optional(),
})

export const GetSuggestionsInputSchema = z.object({ transactionId: z.uuid() })

export const GetStatementSuggestionsInputSchema = z.object({ statementId: z.uuid() })

export const GetTransactionReconciliationInputSchema = z.object({ transactionId: z.uuid() })

export const RejectSuggestionInputSchema = z.object({ transactionId: z.uuid(), payableId: z.uuid() })

// US2 (#269): contrapartidas de transferência entre contas.
export const GetCounterpartSuggestionsInputSchema = z.object({ transactionId: z.uuid() })
export const ConfirmCounterpartInputSchema = z.object({
  transactionId: z.uuid(),
  counterpartId: z.uuid(),
})

const DifferenceInputSchema = z.object({
  valueCents: z.int(), // pode ser negativo (ex.: Discount)
  treatment: z.enum(DIFFERENCE_TREATMENTS),
  costCenterRef: z.string().trim().min(1).max(64).optional(),
  note: z.string().trim().min(1).max(500).optional(),
})

// M2 (specs/110) — os 5 refs da reclassificação. UUID na borda (§IX): o front só oferece nós existentes
// do plano, mas a server function é um endpoint POST chamável direto — nada confia no client.
export const ReclassificationInputSchema = z.object({
  programRef: z.uuid().optional(),
  budgetPlanRef: z.uuid().optional(),
  costCenterRef: z.uuid().optional(),
  categoryRef: z.uuid().optional(),
  subcategoryRef: z.uuid().optional(),
})

export const CreateReconciliationInputSchema = z.object({
  transactionId: z.uuid(),
  payableIds: z.array(z.uuid()).min(1).max(100).readonly(),
  difference: DifferenceInputSchema.optional(),
  reclassification: ReclassificationInputSchema.optional(),
})

export const UndoReconciliationInputSchema = z.object({
  reconciliationId: z.uuid(),
  reason: z.string().trim().max(500).optional(),
})

const ManualEntryTemplateSchema = z.object({
  type: z.enum(MANUAL_ENTRY_TYPES),
  supplierRef: z.uuid().optional(),
  // #502/S2: plano + subcategoria (folha) no título manual — aditivos, coerentes com o documento (S1).
  budgetPlanRef: z.uuid().optional(),
  categoryRef: z.uuid().optional(),
  subcategoryRef: z.uuid().optional(),
  costCenterRef: z.uuid().optional(),
  programRef: z.uuid().optional(),
  description: z.string().trim().max(500).optional(),
  destinationAccount: z.uuid().optional(),
  productLabel: z.string().trim().min(1).max(120).optional(), // #143: produto da Aplicação/Resgate
  // #370: campos de documento (opcionais; aplicabilidade por tipo é do front — só Pagamento/Recebimento).
  // `documentValueCents` omitido → o backend usa o valor da transação conciliada.
  documentNumber: z.string().trim().min(1).max(60).optional(),
  documentType: z.enum(DOCUMENT_TYPES).optional(),
  issueDate: DateSchema.optional(), // YYYY-MM-DD
  documentValueCents: z.string().trim().regex(/^\d+$/).optional(),
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

export const ReopenPeriodInputSchema = z.object({ periodId: z.uuid() }) // #203

export const ListReconciliationPeriodsInputSchema = z.object({ debitAccountRef: z.uuid() })

// #649: conta + intervalo (sem periodId). O core-api valida `z.iso.date()` no mesmo formato.
export const ExportReconciliationInputSchema = z.object({
  debitAccountRef: z.uuid(),
  periodStart: z.iso.date(),
  periodEnd: z.iso.date(),
  format: z.enum(['ofx', 'csv', 'csv-nibo']),
})

// ── Guardas schema ≡ domínio (§IV/§VI) ──────────────────────────────────────────
type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const _g_import: AssertEqual<z.infer<typeof ImportStatementInputSchema>, R.ImportStatementInput> = true
const _g_listTx: AssertEqual<z.infer<typeof ListTransactionsInputSchema>, R.ListTransactionsInput> = true
const _g_sugg: AssertEqual<z.infer<typeof GetSuggestionsInputSchema>, R.GetSuggestionsInput> = true
const _g_stmtSugg: AssertEqual<
  z.infer<typeof GetStatementSuggestionsInputSchema>,
  R.GetStatementSuggestionsInput
> = true
const _g_getTxRecon: AssertEqual<
  z.infer<typeof GetTransactionReconciliationInputSchema>,
  R.GetTransactionReconciliationInput
> = true
const _g_reject: AssertEqual<z.infer<typeof RejectSuggestionInputSchema>, R.RejectSuggestionInput> = true
const _g_counterpartSugg: AssertEqual<
  z.infer<typeof GetCounterpartSuggestionsInputSchema>,
  R.GetCounterpartSuggestionsInput
> = true
const _g_confirmCounterpart: AssertEqual<
  z.infer<typeof ConfirmCounterpartInputSchema>,
  R.ConfirmCounterpartInput
> = true
const _g_recon: AssertEqual<
  z.infer<typeof CreateReconciliationInputSchema>,
  R.CreateReconciliationInput
> = true
const _g_undo: AssertEqual<z.infer<typeof UndoReconciliationInputSchema>, R.UndoReconciliationInput> = true
const _g_manual: AssertEqual<z.infer<typeof ManualEntryInputSchema>, R.ManualEntryInput> = true
const _g_batch: AssertEqual<z.infer<typeof BatchReconcileInputSchema>, R.BatchReconcileInput> = true
const _g_close: AssertEqual<z.infer<typeof ClosePeriodInputSchema>, R.ClosePeriodInput> = true
const _g_reopen: AssertEqual<z.infer<typeof ReopenPeriodInputSchema>, R.ReopenPeriodInput> = true
const _g_listPeriods: AssertEqual<
  z.infer<typeof ListReconciliationPeriodsInputSchema>,
  R.ListReconciliationPeriodsInput
> = true
const _g_export: AssertEqual<
  z.infer<typeof ExportReconciliationInputSchema>,
  R.ExportReconciliationInput
> = true
const _g_createAcc: AssertEqual<
  z.infer<typeof CreateCedenteAccountInputSchema>,
  R.CreateCedenteAccountInput
> = true
const _g_getStmt: AssertEqual<
  z.infer<typeof GetAccountStatementInputSchema>,
  R.GetAccountStatementInput
> = true

void _g_import
void _g_listTx
void _g_sugg
void _g_stmtSugg
void _g_getTxRecon
void _g_reject
void _g_counterpartSugg
void _g_confirmCounterpart
void _g_recon
void _g_undo
void _g_manual
void _g_batch
void _g_close
void _g_reopen
void _g_listPeriods
void _g_export
