/**
 * CollaboratorRepository — porta do client para o BFF. Converte `{ ok, data|error }` → `Result` (§II).
 * Tipos do próprio `data/model`; `PartnersError`/`FnResult` do `partners-error.ts` neutro (boundary §I).
 * Fns injetadas (testável). Espelha `act.repository.ts`, com as 2 operações a mais do colaborador:
 * `completeRegistration` (2ª etapa) e `import` (CSV em lote). `deactivate` exige Motivo.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  CollaboratorDetail,
  CollaboratorListInput,
  CollaboratorListResponse,
  CollaboratorWriteInput,
  CollaboratorCompleteInput,
  CollaboratorDeactivateInput,
  CollaboratorImportInput,
  CollaboratorImportResult,
} from '#modules/partners/client/data/model/collaborator.model.ts'
import type { PartnersError, FnResult } from '#modules/partners/client/data/repository/partners-error.ts'

type ListFn = (opts: { data: CollaboratorListInput }) => Promise<FnResult<CollaboratorListResponse>>
type GetFn = (opts: { data: { id: string } }) => Promise<FnResult<CollaboratorDetail>>
type CreateFn = (opts: { data: CollaboratorWriteInput }) => Promise<FnResult<CollaboratorDetail>>
type CompleteFn = (opts: { data: CollaboratorCompleteInput }) => Promise<FnResult<CollaboratorDetail>>
type UpdateFn = (opts: { data: CollaboratorWriteInput & { id: string } }) => Promise<FnResult<CollaboratorDetail>>
type DeactivateFn = (opts: { data: CollaboratorDeactivateInput }) => Promise<FnResult<CollaboratorDetail>>
type ReactivateFn = (opts: { data: { id: string } }) => Promise<FnResult<CollaboratorDetail>>
type ImportFn = (opts: { data: CollaboratorImportInput }) => Promise<FnResult<CollaboratorImportResult>>

export type CollaboratorRepository = Readonly<{
  list: (input: CollaboratorListInput) => Promise<Result<CollaboratorListResponse, PartnersError>>
  getById: (id: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  create: (input: CollaboratorWriteInput) => Promise<Result<CollaboratorDetail, PartnersError>>
  completeRegistration: (input: CollaboratorCompleteInput) => Promise<Result<CollaboratorDetail, PartnersError>>
  update: (input: CollaboratorWriteInput & { id: string }) => Promise<Result<CollaboratorDetail, PartnersError>>
  deactivate: (input: CollaboratorDeactivateInput) => Promise<Result<CollaboratorDetail, PartnersError>>
  reactivate: (id: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  importCsv: (input: CollaboratorImportInput) => Promise<Result<CollaboratorImportResult, PartnersError>>
}>

export const createCollaboratorRepository = (
  deps: Readonly<{
    listCollaboratorsFn: ListFn
    getCollaboratorFn: GetFn
    createCollaboratorFn: CreateFn
    completeCollaboratorRegistrationFn: CompleteFn
    updateCollaboratorFn: UpdateFn
    deactivateCollaboratorFn: DeactivateFn
    reactivateCollaboratorFn: ReactivateFn
    importCollaboratorsFn: ImportFn
  }>,
): CollaboratorRepository => ({
  list: async (input) => {
    const res = await deps.listCollaboratorsFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getById: async (id) => {
    const res = await deps.getCollaboratorFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  create: async (input) => {
    const res = await deps.createCollaboratorFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  completeRegistration: async (input) => {
    const res = await deps.completeCollaboratorRegistrationFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  update: async (input) => {
    const res = await deps.updateCollaboratorFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  deactivate: async (input) => {
    const res = await deps.deactivateCollaboratorFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  reactivate: async (id) => {
    const res = await deps.reactivateCollaboratorFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  importCsv: async (input) => {
    const res = await deps.importCollaboratorsFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
