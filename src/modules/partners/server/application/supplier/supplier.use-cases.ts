/**
 * Use-cases de Supplier (application) — orquestram o client do core-api. Thin sobre a borda; sem I/O
 * direto (o client é injetado). Result em tudo (§II). O `SupplierClient` é uma porta — em adapters.
 */
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import { CNPJ } from '#modules/partners/server/domain/value-objects/cnpj.value-object.ts'
import { Email } from '#modules/partners/server/domain/value-objects/email.value-object.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

// Exercita os VOs branded na escrita: valida DV do CNPJ + formato do email antes de tocar o core-api (§IV).
const identityIsValid = (cnpj: string, email: string): boolean => !isErr(CNPJ(cnpj)) && !isErr(Email(email))
import type {
  ListSuppliersInput,
  SupplierListResponse,
  SupplierDetail,
  CreateSupplierInput,
  UpdateSupplierInput,
} from '#modules/partners/server/domain/supplier/supplier.io.ts'

export type SupplierClient = Readonly<{
  list: (input: ListSuppliersInput, token: string) => Promise<Result<SupplierListResponse, PartnersError>>
  getById: (id: string, token: string) => Promise<Result<SupplierDetail, PartnersError>>
  create: (input: CreateSupplierInput, token: string) => Promise<Result<SupplierDetail, PartnersError>>
  update: (input: UpdateSupplierInput, token: string) => Promise<Result<SupplierDetail, PartnersError>>
  deactivate: (id: string, token: string) => Promise<Result<SupplierDetail, PartnersError>>
  reactivate: (id: string, token: string) => Promise<Result<SupplierDetail, PartnersError>>
  listServiceCategories: (token: string) => Promise<Result<readonly string[], PartnersError>>
}>

type Deps = Readonly<{ client: SupplierClient }>

export const createListSuppliers =
  (deps: Deps) =>
  (input: ListSuppliersInput, token: string): Promise<Result<SupplierListResponse, PartnersError>> =>
    deps.client.list(input, token)

export const createGetSupplier =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<SupplierDetail, PartnersError>> =>
    deps.client.getById(id, token)

export const createCreateSupplier =
  (deps: Deps) =>
  (input: CreateSupplierInput, token: string): Promise<Result<SupplierDetail, PartnersError>> =>
    identityIsValid(input.cnpj, input.email)
      ? deps.client.create(input, token)
      : Promise.resolve(err('validation'))

export const createUpdateSupplier =
  (deps: Deps) =>
  (input: UpdateSupplierInput, token: string): Promise<Result<SupplierDetail, PartnersError>> =>
    identityIsValid(input.cnpj, input.email)
      ? deps.client.update(input, token)
      : Promise.resolve(err('validation'))

export const createDeactivateSupplier =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<SupplierDetail, PartnersError>> =>
    deps.client.deactivate(id, token)

export const createReactivateSupplier =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<SupplierDetail, PartnersError>> =>
    deps.client.reactivate(id, token)

export const createListServiceCategories =
  (deps: Deps) =>
  (token: string): Promise<Result<readonly string[], PartnersError>> =>
    deps.client.listServiceCategories(token)
