/**
 * Use-cases de Financier (application) — orquestram o client do core-api. Thin sobre a borda; sem I/O
 * direto (o client é injetado). Result em tudo (§II). O `FinancierClient` é uma porta — em adapters.
 */
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import { CNPJ } from '#modules/partners/server/domain/value-objects/cnpj.value-object.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

// Exercita o VO branded na escrita: valida DV do CNPJ antes de tocar o core-api (§IV). PJ-only → sem email.
const cnpjIsValid = (cnpj: string): boolean => !isErr(CNPJ(cnpj))
import type {
  ListFinanciersInput,
  FinancierListResponse,
  FinancierDetail,
  CreateFinancierInput,
  UpdateFinancierInput,
} from '#modules/partners/server/domain/financier/financier.io.ts'

export type FinancierClient = Readonly<{
  list: (input: ListFinanciersInput, token: string) => Promise<Result<FinancierListResponse, PartnersError>>
  getById: (id: string, token: string) => Promise<Result<FinancierDetail, PartnersError>>
  create: (input: CreateFinancierInput, token: string) => Promise<Result<FinancierDetail, PartnersError>>
  update: (input: UpdateFinancierInput, token: string) => Promise<Result<FinancierDetail, PartnersError>>
  deactivate: (id: string, token: string) => Promise<Result<FinancierDetail, PartnersError>>
  reactivate: (id: string, token: string) => Promise<Result<FinancierDetail, PartnersError>>
}>

type Deps = Readonly<{ client: FinancierClient }>

export const createListFinanciers =
  (deps: Deps) =>
  (input: ListFinanciersInput, token: string): Promise<Result<FinancierListResponse, PartnersError>> =>
    deps.client.list(input, token)

export const createGetFinancier =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<FinancierDetail, PartnersError>> =>
    deps.client.getById(id, token)

export const createCreateFinancier =
  (deps: Deps) =>
  (input: CreateFinancierInput, token: string): Promise<Result<FinancierDetail, PartnersError>> =>
    cnpjIsValid(input.cnpj) ? deps.client.create(input, token) : Promise.resolve(err('validation'))

export const createUpdateFinancier =
  (deps: Deps) =>
  (input: UpdateFinancierInput, token: string): Promise<Result<FinancierDetail, PartnersError>> =>
    cnpjIsValid(input.cnpj) ? deps.client.update(input, token) : Promise.resolve(err('validation'))

export const createDeactivateFinancier =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<FinancierDetail, PartnersError>> =>
    deps.client.deactivate(id, token)

export const createReactivateFinancier =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<FinancierDetail, PartnersError>> =>
    deps.client.reactivate(id, token)
