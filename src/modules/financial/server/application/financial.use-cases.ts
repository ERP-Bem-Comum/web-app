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
  CancelInput,
  ManualPaymentInput,
  ListPayableTitlesInput,
  PayableTitleListResponse,
  RecentPayment,
} from '#modules/financial/server/domain/document.io.ts'

export type FinancialClient = Readonly<{
  list: (input: ListDocumentsInput, token: string) => Promise<Result<DocumentListResponse, FinancialError>>
  listPayableTitles: (
    input: ListPayableTitlesInput,
    token: string,
  ) => Promise<Result<PayableTitleListResponse, FinancialError>>
  getById: (id: string, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  create: (input: CreateDocumentInput, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  adjust: (input: AdjustDocumentInput, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  approve: (input: ApproveInput, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  undoApproval: (input: ApproveInput, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  cancel: (input: CancelInput, token: string) => Promise<Result<void, FinancialError>>
  registerManualPayment: (
    input: ManualPaymentInput,
    token: string,
  ) => Promise<Result<DocumentDetail, FinancialError>>
  getRecentPayments: (token: string) => Promise<Result<readonly RecentPayment[], FinancialError>>
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

export const createGetDocument =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.getById(id, token)

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
