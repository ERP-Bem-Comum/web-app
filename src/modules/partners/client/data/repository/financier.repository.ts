/**
 * FinancierRepository — porta do client para o BFF (server functions). Converte o `{ ok, data|error }`
 * do RPC em `Result` (§II). Tipos do próprio `data/model`; `PartnersError`/`FnResult` do arquivo neutro
 * `partners-error.ts` (boundary §I: client-data não importa server/domain nem public-api). As fns são
 * injetadas (testável). Espelha o `SupplierRepository`, sem `categories`.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  FinancierDetail,
  FinancierListInput,
  FinancierListResponse,
  FinancierWriteInput,
} from '#modules/partners/client/data/model/financier.model.ts'
import type { PartnersError, FnResult } from '#modules/partners/client/data/repository/partners-error.ts'

type ListFn = (opts: { data: FinancierListInput }) => Promise<FnResult<FinancierListResponse>>
type GetFn = (opts: { data: { id: string } }) => Promise<FnResult<FinancierDetail>>
type CreateFn = (opts: { data: FinancierWriteInput }) => Promise<FnResult<FinancierDetail>>
type UpdateFn = (opts: { data: FinancierWriteInput & { id: string } }) => Promise<FnResult<FinancierDetail>>
type StatusFn = (opts: { data: { id: string } }) => Promise<FnResult<FinancierDetail>>

export type FinancierRepository = Readonly<{
  list: (input: FinancierListInput) => Promise<Result<FinancierListResponse, PartnersError>>
  getById: (id: string) => Promise<Result<FinancierDetail, PartnersError>>
  create: (input: FinancierWriteInput) => Promise<Result<FinancierDetail, PartnersError>>
  update: (input: FinancierWriteInput & { id: string }) => Promise<Result<FinancierDetail, PartnersError>>
  deactivate: (id: string) => Promise<Result<FinancierDetail, PartnersError>>
  reactivate: (id: string) => Promise<Result<FinancierDetail, PartnersError>>
}>

export const createFinancierRepository = (
  deps: Readonly<{
    listFinanciersFn: ListFn
    getFinancierFn: GetFn
    createFinancierFn: CreateFn
    updateFinancierFn: UpdateFn
    deactivateFinancierFn: StatusFn
    reactivateFinancierFn: StatusFn
  }>,
): FinancierRepository => ({
  list: async (input) => {
    const res = await deps.listFinanciersFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getById: async (id) => {
    const res = await deps.getFinancierFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  create: async (input) => {
    const res = await deps.createFinancierFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  update: async (input) => {
    const res = await deps.updateFinancierFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  deactivate: async (id) => {
    const res = await deps.deactivateFinancierFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  reactivate: async (id) => {
    const res = await deps.reactivateFinancierFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
