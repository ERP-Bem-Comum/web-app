/**
 * ActRepository — porta do client para o BFF. Converte `{ ok, data|error }` → `Result` (§II). Tipos do
 * próprio `data/model`; `PartnersError`/`FnResult` do `partners-error.ts` neutro (boundary §I). Fns
 * injetadas (testável). Espelha o `FinancierRepository` (mesmo conjunto de 6 fns).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  ActDetail,
  ActListInput,
  ActListResponse,
  ActWriteInput,
} from '#modules/partners/client/data/model/act.model.ts'
import type { PartnersError, FnResult } from '#modules/partners/client/data/repository/partners-error.ts'

type ListFn = (opts: { data: ActListInput }) => Promise<FnResult<ActListResponse>>
type GetFn = (opts: { data: { id: string } }) => Promise<FnResult<ActDetail>>
type CreateFn = (opts: { data: ActWriteInput }) => Promise<FnResult<ActDetail>>
type UpdateFn = (opts: { data: ActWriteInput & { id: string } }) => Promise<FnResult<ActDetail>>
type StatusFn = (opts: { data: { id: string } }) => Promise<FnResult<ActDetail>>

export type ActRepository = Readonly<{
  list: (input: ActListInput) => Promise<Result<ActListResponse, PartnersError>>
  getById: (id: string) => Promise<Result<ActDetail, PartnersError>>
  create: (input: ActWriteInput) => Promise<Result<ActDetail, PartnersError>>
  update: (input: ActWriteInput & { id: string }) => Promise<Result<ActDetail, PartnersError>>
  deactivate: (id: string) => Promise<Result<ActDetail, PartnersError>>
  reactivate: (id: string) => Promise<Result<ActDetail, PartnersError>>
}>

export const createActRepository = (
  deps: Readonly<{
    listActsFn: ListFn
    getActFn: GetFn
    createActFn: CreateFn
    updateActFn: UpdateFn
    deactivateActFn: StatusFn
    reactivateActFn: StatusFn
  }>,
): ActRepository => ({
  list: async (input) => {
    const res = await deps.listActsFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getById: async (id) => {
    const res = await deps.getActFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  create: async (input) => {
    const res = await deps.createActFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  update: async (input) => {
    const res = await deps.updateActFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  deactivate: async (id) => {
    const res = await deps.deactivateActFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  reactivate: async (id) => {
    const res = await deps.reactivateActFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
