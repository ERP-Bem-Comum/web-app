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

/** Erros do módulo partners propagados pelo BFF — espelha `PartnersError` do server (string union). */
export type PartnersError =
  | 'not-found'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'connectivity'
  | 'server'
  | 'collaborator-import-malformed'
  | 'invalid-registration-transition'
  | 'deactivation-reason-required'
  | 'invalid-service-category'
  | 'invalid-state'
  | 'invalid-ibge-code'

type FnResult<T> = Readonly<{ ok: true; data: T }> | Readonly<{ ok: false; error: PartnersError }>

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
