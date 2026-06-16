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
} from '#modules/financial/client/data/model/document.model.ts'
import type { FinancialError, FnResult } from '#modules/financial/client/data/repository/financial-error.ts'

type ListFn = (opts: { data: ListDocumentsInput }) => Promise<FnResult<DocumentListResponse>>
type GetFn = (opts: { data: { id: string } }) => Promise<FnResult<DocumentDetail>>
type CreateFn = (opts: { data: CreateDocumentInput }) => Promise<FnResult<DocumentDetail>>
type AdjustFn = (opts: { data: AdjustDocumentInput }) => Promise<FnResult<DocumentDetail>>
type ApproveFn = (opts: { data: ApproveInput }) => Promise<FnResult<DocumentDetail>>
type CancelFn = (opts: { data: CancelInput }) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; error: FinancialError }>>

export type FinancialRepository = Readonly<{
  list: (input: ListDocumentsInput) => Promise<Result<DocumentListResponse, FinancialError>>
  getById: (id: string) => Promise<Result<DocumentDetail, FinancialError>>
  create: (input: CreateDocumentInput) => Promise<Result<DocumentDetail, FinancialError>>
  adjust: (input: AdjustDocumentInput) => Promise<Result<DocumentDetail, FinancialError>>
  approve: (input: ApproveInput) => Promise<Result<DocumentDetail, FinancialError>>
  undoApproval: (input: ApproveInput) => Promise<Result<DocumentDetail, FinancialError>>
  cancel: (input: CancelInput) => Promise<Result<void, FinancialError>>
}>

export const createFinancialRepository = (
  deps: Readonly<{
    listDocumentsFn: ListFn
    getDocumentFn: GetFn
    createDocumentFn: CreateFn
    adjustDocumentFn: AdjustFn
    approveDocumentFn: ApproveFn
    undoApprovalFn: ApproveFn
    cancelDocumentFn: CancelFn
  }>,
): FinancialRepository => ({
  list: async (input) => {
    const res = await deps.listDocumentsFn({ data: input })
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
})
