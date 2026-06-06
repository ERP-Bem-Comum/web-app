/**
 * Use-cases de Colaborador (application) — orquestram o client do core-api. Thin sobre a borda; sem I/O
 * direto (o client é injetado). Result em tudo (§II). O `Client` é uma porta — implementada em adapters.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type {
  ListCollaboratorsInput,
  CollaboratorListResponse,
  CollaboratorDetail,
  CreateCollaboratorInput,
} from '#modules/partners/server/domain/collaborator/collaborator.io.ts'
import type { DeactivationReason } from '#modules/partners/server/domain/collaborator/collaborator.types.ts'

export type CollaboratorClient = Readonly<{
  list: (input: ListCollaboratorsInput, token: string) => Promise<Result<CollaboratorListResponse, PartnersError>>
  getById: (id: string, token: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  create: (input: CreateCollaboratorInput, token: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  deactivate: (id: string, reason: DeactivationReason, token: string) => Promise<Result<CollaboratorDetail, PartnersError>>
  reactivate: (id: string, token: string) => Promise<Result<CollaboratorDetail, PartnersError>>
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
    deps.client.create(input, token)

export const createDeactivateCollaborator =
  (deps: Deps) =>
  (id: string, reason: DeactivationReason, token: string): Promise<Result<CollaboratorDetail, PartnersError>> =>
    deps.client.deactivate(id, reason, token)
