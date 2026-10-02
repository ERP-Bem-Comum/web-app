/**
 * Use-cases de Supplier (application) — orquestram o client do core-api. Thin sobre a borda; sem I/O
 * direto (o client é injetado). Result em tudo (§II). O `SupplierClient` é uma porta — em adapters.
 */
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import { normalizeCnpj } from '#shared/document/cnpj.ts'
import { CNPJ } from '#modules/partners/server/domain/value-objects/cnpj.value-object.ts'
import { CPF } from '#modules/partners/server/domain/value-objects/cpf.value-object.ts'
import { Email } from '#modules/partners/server/domain/value-objects/email.value-object.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type {
  ListSuppliersInput,
  SupplierListResponse,
  SupplierDetail,
  CreateSupplierInput,
  UpdateSupplierInput,
} from '#modules/partners/server/domain/supplier/supplier.io.ts'

/**
 * Documento do fornecedor (#1022), espelhando o `SupplierDocument.parse` do core-api: letra ou 14
 * caracteres → CNPJ (alfanumérico); 11 dígitos → CPF; outro tamanho → inválido. O DV é dos VOs.
 */
const documentKind = (raw: string): 'cpf' | 'cnpj' | null => {
  const bare = normalizeCnpj(raw)
  if (/[A-Z]/.test(bare) || bare.length === 14) return isErr(CNPJ(bare)) ? null : 'cnpj'
  if (bare.length === 11) return isErr(CPF(bare)) ? null : 'cpf'
  return null
}

const filled = (v: string | null): boolean => v !== null && v.trim() !== ''

/**
 * Exercita os VOs branded na escrita antes de tocar o core-api (§IV): documento válido (CPF ou CNPJ),
 * e-mail válido e a identidade coerente com o documento — PJ exige razão social e nome fantasia; PF não
 * os tem (o core-api recusa PF com esses campos preenchidos, em vez de ignorá-los).
 */
const identityIsValid = (input: CreateSupplierInput): boolean => {
  if (isErr(Email(input.email))) return false
  const kind = documentKind(input.document)
  if (kind === 'cnpj') return filled(input.corporateName) && filled(input.fantasyName)
  if (kind === 'cpf') return !filled(input.corporateName) && !filled(input.fantasyName)
  return false
}

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
    identityIsValid(input) ? deps.client.create(input, token) : Promise.resolve(err('validation'))

export const createUpdateSupplier =
  (deps: Deps) =>
  (input: UpdateSupplierInput, token: string): Promise<Result<SupplierDetail, PartnersError>> =>
    identityIsValid(input) ? deps.client.update(input, token) : Promise.resolve(err('validation'))

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
