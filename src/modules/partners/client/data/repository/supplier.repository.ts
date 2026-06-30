/**
 * SupplierRepository — porta do client para o BFF (server functions). Converte o `{ ok, data|error }`
 * do RPC em `Result` (§II). Tipos do próprio `data/model` + `PartnersError` definido localmente (boundary
 * §I: client-data não importa server/domain nem public-api). As fns são injetadas (testável).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  SupplierDetail,
  SupplierListInput,
  SupplierListResponse,
  SupplierWriteInput,
} from '#modules/partners/client/data/model/supplier.model.ts'
import type { PartnersError, FnResult } from '#modules/partners/client/data/repository/partners-error.ts'

// `PartnersError`/`FnResult` vivem em `partners-error.ts` (neutro, compartilhado entre verticais do
// módulo — supplier/financier/…). Reexportado aqui por compat com quem já importa daqui (§I boundary).
export type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'

type ListFn = (opts: { data: SupplierListInput }) => Promise<FnResult<SupplierListResponse>>
type GetFn = (opts: { data: { id: string } }) => Promise<FnResult<SupplierDetail>>
type CreateFn = (opts: { data: SupplierWriteInput }) => Promise<FnResult<SupplierDetail>>
type UpdateFn = (opts: { data: SupplierWriteInput & { id: string } }) => Promise<FnResult<SupplierDetail>>
type StatusFn = (opts: { data: { id: string } }) => Promise<FnResult<SupplierDetail>>
type CategoriesFn = () => Promise<FnResult<readonly string[]>>

export type SupplierRepository = Readonly<{
  list: (input: SupplierListInput) => Promise<Result<SupplierListResponse, PartnersError>>
  getById: (id: string) => Promise<Result<SupplierDetail, PartnersError>>
  create: (input: SupplierWriteInput) => Promise<Result<SupplierDetail, PartnersError>>
  update: (input: SupplierWriteInput & { id: string }) => Promise<Result<SupplierDetail, PartnersError>>
  deactivate: (id: string) => Promise<Result<SupplierDetail, PartnersError>>
  reactivate: (id: string) => Promise<Result<SupplierDetail, PartnersError>>
  categories: () => Promise<Result<readonly string[], PartnersError>>
}>

export const createSupplierRepository = (
  deps: Readonly<{
    listSuppliersFn: ListFn
    getSupplierFn: GetFn
    createSupplierFn: CreateFn
    updateSupplierFn: UpdateFn
    deactivateSupplierFn: StatusFn
    reactivateSupplierFn: StatusFn
    listServiceCategoriesFn: CategoriesFn
  }>,
): SupplierRepository => ({
  list: async (input) => {
    const res = await deps.listSuppliersFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getById: async (id) => {
    const res = await deps.getSupplierFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  create: async (input) => {
    const res = await deps.createSupplierFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  update: async (input) => {
    const res = await deps.updateSupplierFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  deactivate: async (id) => {
    const res = await deps.deactivateSupplierFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  reactivate: async (id) => {
    const res = await deps.reactivateSupplierFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  categories: async () => {
    const res = await deps.listServiceCategoriesFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
})
