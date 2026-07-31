/**
 * Use-cases do Financeiro / Contas a Pagar (application) — thin sobre a borda; sem I/O direto (o client
 * é injetado). Result em tudo (§II). `FinancialClient` é a porta — implementada em adapters
 * (`core-api-financial.ts`). Espelha `users.use-cases.ts`.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'
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
  RecentPayment,
  DocumentTimelineEvent,
  DocumentSourceFile,
} from '#modules/financial/server/domain/document.io.ts'
import type {
  DashboardCostCenters,
  DashboardNoContractSupplier,
} from '#modules/financial/server/domain/dashboard.io.ts'

export type FinancialClient = Readonly<{
  list: (input: ListDocumentsInput, token: string) => Promise<Result<DocumentListResponse, FinancialError>>
  listPayableTitles: (
    input: ListPayableTitlesInput,
    token: string,
  ) => Promise<Result<PayableTitleListResponse, FinancialError>>
  getById: (id: string, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  // #568: comprovante-fonte (bytes base64 + mimeType) — o BFF busca COM o token; o browser nunca acessa.
  getSourceFile: (id: string, token: string) => Promise<Result<DocumentSourceFile, FinancialError>>
  // Trilha de auditoria (GET /documents/:id/timeline). Eventos CRUS (actor = UUID; o nome é resolvido na fn).
  getTimeline: (
    id: string,
    token: string,
  ) => Promise<Result<readonly DocumentTimelineEvent[], FinancialError>>
  create: (input: CreateDocumentInput, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  adjust: (input: AdjustDocumentInput, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  approve: (input: ApproveInput, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  // #270: vencimento de UM título isolado (não propaga pai↔filhos). Devolve o documento atualizado.
  updatePayableDueDate: (
    input: UpdatePayableDueDateInput,
    token: string,
  ) => Promise<Result<DocumentDetail, FinancialError>>
  undoApproval: (input: ApproveInput, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  cancel: (input: CancelInput, token: string) => Promise<Result<void, FinancialError>>
  registerManualPayment: (
    input: ManualPaymentInput,
    token: string,
  ) => Promise<Result<DocumentDetail, FinancialError>>
  getRecentPayments: (token: string) => Promise<Result<readonly RecentPayment[], FinancialError>>
  // #241/#237: KPI "Despesas por Centro de Custo" do Dashboard (cost-centers + variação M-1 vs M-2).
  getDashboardCostCenters: (token: string) => Promise<Result<DashboardCostCenters, FinancialError>>
  // #242: widget "Fornecedores sem Contrato" do Dashboard (top-5 por total pago).
  getDashboardNoContractSuppliers: (
    token: string,
  ) => Promise<Result<readonly DashboardNoContractSupplier[], FinancialError>>
  // #536: contagem agregada por status (chips do grid).
  getPayableCounts: (
    input: PayableCountsInput,
    token: string,
  ) => Promise<Result<PayableCounts, FinancialError>>
}>

type Deps = Readonly<{ client: FinancialClient }>

export const createListDocuments =
  (deps: Deps) =>
  (input: ListDocumentsInput, token: string): Promise<Result<DocumentListResponse, FinancialError>> =>
    deps.client.list(input, token)

export const createListPayableTitles =
  (deps: Deps) =>
  (input: ListPayableTitlesInput, token: string): Promise<Result<PayableTitleListResponse, FinancialError>> =>
    deps.client.listPayableTitles(input, token)

export const createGetPayableCounts =
  (deps: Deps) =>
  (input: PayableCountsInput, token: string): Promise<Result<PayableCounts, FinancialError>> =>
    deps.client.getPayableCounts(input, token)

export const createGetDocument =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.getById(id, token)

export const createGetDocumentSourceFile =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<DocumentSourceFile, FinancialError>> =>
    deps.client.getSourceFile(id, token)

export const createGetDocumentTimeline =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<readonly DocumentTimelineEvent[], FinancialError>> =>
    deps.client.getTimeline(id, token)

export const createCreateDocument =
  (deps: Deps) =>
  (input: CreateDocumentInput, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.create(input, token)

export const createAdjustDocument =
  (deps: Deps) =>
  (input: AdjustDocumentInput, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.adjust(input, token)

export const createApproveDocument =
  (deps: Deps) =>
  (input: ApproveInput, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.approve(input, token)

export const createUpdatePayableDueDate =
  (deps: Deps) =>
  (input: UpdatePayableDueDateInput, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.updatePayableDueDate(input, token)

export const createUndoApproval =
  (deps: Deps) =>
  (input: ApproveInput, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.undoApproval(input, token)

export const createCancelDocument =
  (deps: Deps) =>
  (input: CancelInput, token: string): Promise<Result<void, FinancialError>> =>
    deps.client.cancel(input, token)

export const createRegisterManualPayment =
  (deps: Deps) =>
  (input: ManualPaymentInput, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.registerManualPayment(input, token)

export const createGetRecentPayments =
  (deps: Deps) =>
  (token: string): Promise<Result<readonly RecentPayment[], FinancialError>> =>
    deps.client.getRecentPayments(token)
