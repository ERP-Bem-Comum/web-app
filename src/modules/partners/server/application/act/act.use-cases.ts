/**
 * Use-cases de Act (application) — orquestram o client do core-api. Thin sobre a borda; sem I/O direto
 * (o client é injetado). Result em tudo (§II). O `ActClient` é uma porta — implementada em adapters.
 */
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import { Email } from '#modules/partners/server/domain/value-objects/email.value-object.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

// Exercita o VO branded de Email na escrita (§IV); o DV do CNPJ é validado pelo core-api (422 invalid-cnpj),
// que é o árbitro final do número.
const identityIsValid = (email: string): boolean => !isErr(Email(email))
import type {
  ListActsInput,
  ActListResponse,
  ActDetail,
  CreateActInput,
  UpdateActInput,
} from '#modules/partners/server/domain/act/act.io.ts'

export type ActClient = Readonly<{
  list: (input: ListActsInput, token: string) => Promise<Result<ActListResponse, PartnersError>>
  getById: (id: string, token: string) => Promise<Result<ActDetail, PartnersError>>
  create: (input: CreateActInput, token: string) => Promise<Result<ActDetail, PartnersError>>
  update: (input: UpdateActInput, token: string) => Promise<Result<ActDetail, PartnersError>>
  deactivate: (id: string, token: string) => Promise<Result<ActDetail, PartnersError>>
  reactivate: (id: string, token: string) => Promise<Result<ActDetail, PartnersError>>
}>

type Deps = Readonly<{ client: ActClient }>

export const createListActs =
  (deps: Deps) =>
  (input: ListActsInput, token: string): Promise<Result<ActListResponse, PartnersError>> =>
    deps.client.list(input, token)

export const createGetAct =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<ActDetail, PartnersError>> =>
    deps.client.getById(id, token)

export const createCreateAct =
  (deps: Deps) =>
  (input: CreateActInput, token: string): Promise<Result<ActDetail, PartnersError>> =>
    identityIsValid(input.email)
      ? deps.client.create(input, token)
      : Promise.resolve(err('validation'))

export const createUpdateAct =
  (deps: Deps) =>
  (input: UpdateActInput, token: string): Promise<Result<ActDetail, PartnersError>> =>
    identityIsValid(input.email)
      ? deps.client.update(input, token)
      : Promise.resolve(err('validation'))

export const createDeactivateAct =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<ActDetail, PartnersError>> =>
    deps.client.deactivate(id, token)

export const createReactivateAct =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<ActDetail, PartnersError>> =>
    deps.client.reactivate(id, token)
