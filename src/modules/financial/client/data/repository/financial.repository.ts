/**
 * FinancialRepository — porta do client para o BFF. Converte `{ ok, data|error }` → `Result` (§II). Tipos
 * do próprio `data/model`; `FinancialError`/`FnResult` do `financial-error.ts` neutro (boundary §I). Fns
 * injetadas (testável). Espelha `users.repository.ts`.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  ListDocumentsInput,
  DocumentListResponse,
  DocumentDetail,
  CreateDocumentInput,
  AdjustDocumentInput,
  ApproveInput,
  CancelInput,
  ManualPaymentInput,
  ListPayableTitlesInput,
  PayableTitleListResponse,
  BulkUpdateDueDateInput,
  BulkUpdateDueDateResult,
} from '#modules/financial/client/data/model/document.model.ts'
import type { RecentPayment } from '#modules/financial/client/data/model/recent-payment.model.ts'
import type { DashboardStatistics } from '#modules/financial/client/data/model/dashboard-statistics.model.ts'
import type { FinancialError, FnResult } from '#modules/financial/client/data/repository/financial-error.ts'

type ListFn = (opts: { data: ListDocumentsInput }) => Promise<FnResult<DocumentListResponse>>
type ListTitlesFn = (opts: { data: ListPayableTitlesInput }) => Promise<FnResult<PayableTitleListResponse>>
type GetFn = (opts: { data: { id: string } }) => Promise<FnResult<DocumentDetail>>
type CreateFn = (opts: { data: CreateDocumentInput }) => Promise<FnResult<DocumentDetail>>
type AdjustFn = (opts: { data: AdjustDocumentInput }) => Promise<FnResult<DocumentDetail>>
type BulkDueDateFn = (opts: { data: BulkUpdateDueDateInput }) => Promise<FnResult<BulkUpdateDueDateResult>>
type ApproveFn = (opts: { data: ApproveInput }) => Promise<FnResult<DocumentDetail>>
type CancelFn = (opts: {
  data: CancelInput
}) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; error: FinancialError }>>
type PayFn = (opts: { data: ManualPaymentInput }) => Promise<FnResult<DocumentDetail>>
// 042: widget "Últimos pagamentos" — sem input (Top-5 do backend).
type RecentPaymentsFn = () => Promise<FnResult<readonly RecentPayment[]>>
// 052: estatísticas do Dashboard — sem input (o BFF compõe o DTO completo).
type DashboardStatisticsFn = () => Promise<FnResult<DashboardStatistics>>

export type FinancialRepository = Readonly<{
  list: (input: ListDocumentsInput) => Promise<Result<DocumentListResponse, FinancialError>>
  // #201: listagem por título (pai + filhos).
  listPayableTitles: (
    input: ListPayableTitlesInput,
  ) => Promise<Result<PayableTitleListResponse, FinancialError>>
  getById: (id: string) => Promise<Result<DocumentDetail, FinancialError>>
  create: (input: CreateDocumentInput) => Promise<Result<DocumentDetail, FinancialError>>
  adjust: (input: AdjustDocumentInput) => Promise<Result<DocumentDetail, FinancialError>>
  // #162: vencimento em lote (N documentos × 1 data). Result carrega o outcome de cada item.
  bulkUpdateDueDate: (
    input: BulkUpdateDueDateInput,
  ) => Promise<Result<BulkUpdateDueDateResult, FinancialError>>
  approve: (input: ApproveInput) => Promise<Result<DocumentDetail, FinancialError>>
  undoApproval: (input: ApproveInput) => Promise<Result<DocumentDetail, FinancialError>>
  cancel: (input: CancelInput) => Promise<Result<void, FinancialError>>
  // #224: baixa manual de um título (Aprovado→Pago).
  registerManualPayment: (input: ManualPaymentInput) => Promise<Result<DocumentDetail, FinancialError>>
  // 042: Top-5 pagamentos recentes (widget do Dashboard). Sem input.
  getRecentPayments: () => Promise<Result<readonly RecentPayment[], FinancialError>>
  // 052: estatísticas do Dashboard (DTO completo composto no BFF). Sem input.
  getDashboardStatistics: () => Promise<Result<DashboardStatistics, FinancialError>>
}>

export const createFinancialRepository = (
  deps: Readonly<{
    listDocumentsFn: ListFn
    listPayableTitlesFn: ListTitlesFn
    getDocumentFn: GetFn
    createDocumentFn: CreateFn
    adjustDocumentFn: AdjustFn
    bulkUpdateDueDateFn: BulkDueDateFn
    approveDocumentFn: ApproveFn
    undoApprovalFn: ApproveFn
    cancelDocumentFn: CancelFn
    registerManualPaymentFn: PayFn
    recentPaymentsFn: RecentPaymentsFn
    dashboardStatisticsFn: DashboardStatisticsFn
  }>,
): FinancialRepository => ({
  list: async (input) => {
    const res = await deps.listDocumentsFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  listPayableTitles: async (input) => {
    const res = await deps.listPayableTitlesFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getById: async (id) => {
    const res = await deps.getDocumentFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  create: async (input) => {
    const res = await deps.createDocumentFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  adjust: async (input) => {
    const res = await deps.adjustDocumentFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  bulkUpdateDueDate: async (input) => {
    const res = await deps.bulkUpdateDueDateFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  approve: async (input) => {
    const res = await deps.approveDocumentFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  undoApproval: async (input) => {
    const res = await deps.undoApprovalFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  cancel: async (input) => {
    const res = await deps.cancelDocumentFn({ data: input })
    return res.ok ? ok(undefined) : err(res.error)
  },
  registerManualPayment: async (input) => {
    const res = await deps.registerManualPaymentFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getRecentPayments: async () => {
    const res = await deps.recentPaymentsFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
  getDashboardStatistics: async () => {
    const res = await deps.dashboardStatisticsFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
})
