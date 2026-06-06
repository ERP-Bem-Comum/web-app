/**
 * Use-cases de Colaborador (application) — orquestram o client do core-api. Thin sobre a borda; sem I/O
 * direto (o client é injetado). Result em tudo (§II). O `Client` é uma porta — implementada em adapters.
 */
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import { CPF } from '#modules/partners/server/domain/value-objects/cpf.value-object.ts'
import { Email } from '#modules/partners/server/domain/value-objects/email.value-object.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

// Exercita os VOs branded na escrita: valida DV do CPF + formato do email antes de tocar o core-api (§IV).
const identityIsValid = (cpf: string, email: string): boolean => !isErr(CPF(cpf)) && !isErr(Email(email))
import type {
  ListCollaboratorsInput,
  CollaboratorListResponse,
  CollaboratorDetail,
  CreateCollaboratorInput,
  CompleteCollaboratorRegistrationInput,
  UpdateCollaboratorInput,
  ImportCollaboratorsInput,
  CollaboratorImportResult,
} from '#modules/partners/server/domain/collaborator/collaborator.io.ts'
import type { DeactivationReason } from '#modules/partners/server/domain/collaborator/collaborator.types.ts'

export type CollaboratorClient = Readonly<{
  list: (input: ListCollaboratorsInput, token: string) => Promise<Result<CollaboratorListResponse, PartnersError>>
  getById: (id: string, token: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  create: (input: CreateCollaboratorInput, token: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  completeRegistration: (input: CompleteCollaboratorRegistrationInput, token: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  update: (input: UpdateCollaboratorInput, token: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  deactivate: (id: string, reason: DeactivationReason, token: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  reactivate: (id: string, token: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  importCsv: (input: ImportCollaboratorsInput, token: string) => Promise<Result<CollaboratorImportResult, PartnersError>>
}>

type Deps = Readonly<{ client: CollaboratorClient }>

export const createListCollaborators =
  (deps: Deps) =>
  (input: ListCollaboratorsInput, token: string): Promise<Result<CollaboratorListResponse, PartnersError>> =>
    deps.client.list(input, token)

export const createGetCollaborator =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<CollaboratorDetail, PartnersError>> =>
    deps.client.getById(id, token)

export const createCreateCollaborator =
  (deps: Deps) =>
  (input: CreateCollaboratorInput, token: string): Promise<Result<CollaboratorDetail, PartnersError>> =>
    identityIsValid(input.cpf, input.email)
      ? deps.client.create(input, token)
      : Promise.resolve(err('validation'))

export const createCompleteCollaboratorRegistration =
  (deps: Deps) =>
  (input: CompleteCollaboratorRegistrationInput, token: string): Promise<Result<CollaboratorDetail, PartnersError>> =>
    deps.client.completeRegistration(input, token)

export const createUpdateCollaborator =
  (deps: Deps) =>
  (input: UpdateCollaboratorInput, token: string): Promise<Result<CollaboratorDetail, PartnersError>> =>
    identityIsValid(input.cpf, input.email)
      ? deps.client.update(input, token)
      : Promise.resolve(err('validation'))

export const createDeactivateCollaborator =
  (deps: Deps) =>
  (id: string, reason: DeactivationReason, token: string): Promise<Result<CollaboratorDetail, PartnersError>> =>
    deps.client.deactivate(id, reason, token)

export const createImportCollaborators =
  (deps: Deps) =>
  (input: ImportCollaboratorsInput, token: string): Promise<Result<CollaboratorImportResult, PartnersError>> =>
    deps.client.importCsv(input, token)
