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
  UpdatePayableDueDateInput,
  CancelInput,
  ManualPaymentInput,
  ListPayableTitlesInput,
  PayableTitleListResponse,
  PayableCountsInput,
  PayableCounts,
  DocumentTimelineEntry,
  DocumentSourceFile,
} from '#modules/financial/client/data/model/document.model.ts'
import type { RecentPayment } from '#modules/financial/client/data/model/recent-payment.model.ts'
import type {
  PreviewRemittanceInput,
  RemittancePreview,
} from '#modules/financial/client/data/model/remittance.model.ts'
import type { DashboardStatistics } from '#modules/financial/client/data/model/dashboard-statistics.model.ts'
import type {
  DashboardRealizedInput,
  DashboardRealizedResult,
} from '#modules/financial/client/data/model/dashboard-realized.model.ts'
import type { FinancialError, FnResult } from '#modules/financial/client/data/repository/financial-error.ts'

type ListFn = (opts: { data: ListDocumentsInput }) => Promise<FnResult<DocumentListResponse>>
type ListTitlesFn = (opts: { data: ListPayableTitlesInput }) => Promise<FnResult<PayableTitleListResponse>>
type PayableCountsFn = (opts: { data: PayableCountsInput }) => Promise<FnResult<PayableCounts>>
// VAN (core-api#728): pré-voo do lote. POST porque a seleção vai no corpo — não porque escreva algo.
type PreviewRemittanceFn = (opts: { data: PreviewRemittanceInput }) => Promise<FnResult<RemittancePreview>>
type GetFn = (opts: { data: { id: string } }) => Promise<FnResult<DocumentDetail>>
type SourceFileFn = (opts: { data: { id: string } }) => Promise<FnResult<DocumentSourceFile>>
type TimelineFn = (opts: { data: { id: string } }) => Promise<FnResult<readonly DocumentTimelineEntry[]>>
type CreateFn = (opts: { data: CreateDocumentInput }) => Promise<FnResult<DocumentDetail>>
type AdjustFn = (opts: { data: AdjustDocumentInput }) => Promise<FnResult<DocumentDetail>>
type ApproveFn = (opts: { data: ApproveInput }) => Promise<FnResult<DocumentDetail>>
type UpdatePayableDueDateFn = (opts: { data: UpdatePayableDueDateInput }) => Promise<FnResult<DocumentDetail>>
type CancelFn = (opts: {
  data: CancelInput
}) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; error: FinancialError }>>
type PayFn = (opts: { data: ManualPaymentInput }) => Promise<FnResult<DocumentDetail>>
// 042: widget "Últimos pagamentos" — sem input (Top-5 do backend).
type RecentPaymentsFn = () => Promise<FnResult<readonly RecentPayment[]>>
// 052: estatísticas do Dashboard — sem input (o BFF compõe o DTO completo).
type DashboardStatisticsFn = () => Promise<FnResult<DashboardStatistics>>
// specs/096 P3: gráfico Realizado × Previsto — input (ano + seleção); o BFF lista aprovados + fan-out.
type DashboardRealizedFn = (opts: {
  data: DashboardRealizedInput
}) => Promise<FnResult<DashboardRealizedResult>>

export type FinancialRepository = Readonly<{
  list: (input: ListDocumentsInput) => Promise<Result<DocumentListResponse, FinancialError>>
  // #201: listagem por título (pai + filhos).
  listPayableTitles: (
    input: ListPayableTitlesInput,
  ) => Promise<Result<PayableTitleListResponse, FinancialError>>
  // #536: contagem agregada por status (chips do grid).
  getPayableCounts: (input: PayableCountsInput) => Promise<Result<PayableCounts, FinancialError>>
  // VAN (core-api#728): pré-voo do lote — o que sai e o que não sai, ANTES de gerar. Leitura pura.
  previewRemittance: (input: PreviewRemittanceInput) => Promise<Result<RemittancePreview, FinancialError>>
  getById: (id: string) => Promise<Result<DocumentDetail, FinancialError>>
  // #568: comprovante-fonte (bytes base64 + mimeType). Busca lazy (só quando há anexo). CA4: via server-fn.
  getSourceFile: (id: string) => Promise<Result<DocumentSourceFile, FinancialError>>
  // Trilha de auditoria (entradas enriquecidas com o nome do autor).
  getTimeline: (id: string) => Promise<Result<readonly DocumentTimelineEntry[], FinancialError>>
  create: (input: CreateDocumentInput) => Promise<Result<DocumentDetail, FinancialError>>
  adjust: (input: AdjustDocumentInput) => Promise<Result<DocumentDetail, FinancialError>>
  approve: (input: ApproveInput) => Promise<Result<DocumentDetail, FinancialError>>
  // #270: vencimento de UM título isolado (não propaga pai↔filhos).
  updatePayableDueDate: (input: UpdatePayableDueDateInput) => Promise<Result<DocumentDetail, FinancialError>>
  undoApproval: (input: ApproveInput) => Promise<Result<DocumentDetail, FinancialError>>
  cancel: (input: CancelInput) => Promise<Result<void, FinancialError>>
  // #224: baixa manual de um título (Aprovado→Pago).
  registerManualPayment: (input: ManualPaymentInput) => Promise<Result<DocumentDetail, FinancialError>>
  // 042: Top-5 pagamentos recentes (widget do Dashboard). Sem input.
  getRecentPayments: () => Promise<Result<readonly RecentPayment[], FinancialError>>
  // 052: estatísticas do Dashboard (DTO completo composto no BFF). Sem input.
  getDashboardStatistics: () => Promise<Result<DashboardStatistics, FinancialError>>
  // specs/096 P3: gráfico Realizado × Previsto (planos aprovados vigentes; todos somados | 1 plano).
  getDashboardRealized: (
    input: DashboardRealizedInput,
  ) => Promise<Result<DashboardRealizedResult, FinancialError>>
}>

export const createFinancialRepository = (
  deps: Readonly<{
    listDocumentsFn: ListFn
    listPayableTitlesFn: ListTitlesFn
    payableCountsFn: PayableCountsFn
    previewRemittanceFn: PreviewRemittanceFn
    getDocumentFn: GetFn
    getDocumentSourceFileFn: SourceFileFn
    getDocumentTimelineFn: TimelineFn
    createDocumentFn: CreateFn
    adjustDocumentFn: AdjustFn
    approveDocumentFn: ApproveFn
    updatePayableDueDateFn: UpdatePayableDueDateFn
    undoApprovalFn: ApproveFn
    cancelDocumentFn: CancelFn
    registerManualPaymentFn: PayFn
    recentPaymentsFn: RecentPaymentsFn
    dashboardStatisticsFn: DashboardStatisticsFn
    dashboardRealizedFn: DashboardRealizedFn
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
  getPayableCounts: async (input) => {
    const res = await deps.payableCountsFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  previewRemittance: async (input) => {
    const res = await deps.previewRemittanceFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getById: async (id) => {
    const res = await deps.getDocumentFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getSourceFile: async (id) => {
    const res = await deps.getDocumentSourceFileFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getTimeline: async (id) => {
    const res = await deps.getDocumentTimelineFn({ data: { id } })
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
  approve: async (input) => {
    const res = await deps.approveDocumentFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  updatePayableDueDate: async (input) => {
    const res = await deps.updatePayableDueDateFn({ data: input })
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
  getDashboardRealized: async (input) => {
    const res = await deps.dashboardRealizedFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
