/**
 * Use-cases de Users (application) — orquestram o client do core-api. Thin sobre a borda; sem I/O direto
 * (o client é injetado). Result em tudo (§II). O `UserClient` é uma porta — implementada em adapters.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'
import type {
  ListUsersInput,
  UserListResponse,
  CreateUserInput,
  CreatedUser,
  UserDetail,
  UpdateUserInput,
  UpdateMeInput,
  ChangePasswordInput,
} from '#modules/users/server/domain/user.io.ts'

// Foto (binário): GET devolve bytes+mime; upload (PUT) envia bytes crus + ?mimeType= → sem corpo útil.
export type UserPhoto = Readonly<{ bytes: Uint8Array; contentType: string }>
export type UserPhotoUpload = Readonly<{ bytes: Uint8Array; mimeType: string }>

export type UserClient = Readonly<{
  list: (input: ListUsersInput, token: string) => Promise<Result<UserListResponse, UsersError>>
  create: (input: CreateUserInput, token: string) => Promise<Result<CreatedUser, UsersError>>
  getById: (id: string, token: string) => Promise<Result<UserDetail, UsersError>>
  update: (id: string, input: UpdateUserInput, token: string) => Promise<Result<UserDetail, UsersError>>
  setActive: (id: string, active: boolean, token: string) => Promise<Result<UserDetail, UsersError>>
  getMe: (token: string) => Promise<Result<UserDetail, UsersError>>
  updateMe: (input: UpdateMeInput, token: string) => Promise<Result<UserDetail, UsersError>>
  changePassword: (input: ChangePasswordInput, token: string) => Promise<Result<void, UsersError>>
  // Foto de perfil — autosserviço (/me) e admin (/users/:id).
  getMyPhoto: (token: string) => Promise<Result<UserPhoto, UsersError>>
  uploadMyPhoto: (input: UserPhotoUpload, token: string) => Promise<Result<void, UsersError>>
  getUserPhoto: (id: string, token: string) => Promise<Result<UserPhoto, UsersError>>
  uploadUserPhoto: (id: string, input: UserPhotoUpload, token: string) => Promise<Result<void, UsersError>>
}>

type Deps = Readonly<{ client: UserClient }>

export const createListUsers =
  (deps: Deps) =>
  (input: ListUsersInput, token: string): Promise<Result<UserListResponse, UsersError>> =>
    deps.client.list(input, token)

export const createCreateUser =
  (deps: Deps) =>
  (input: CreateUserInput, token: string): Promise<Result<CreatedUser, UsersError>> =>
    deps.client.create(input, token)

export const createGetUser =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<UserDetail, UsersError>> =>
    deps.client.getById(id, token)

export const createUpdateUser =
  (deps: Deps) =>
  (id: string, input: UpdateUserInput, token: string): Promise<Result<UserDetail, UsersError>> =>
    deps.client.update(id, input, token)

export const createSetUserActive =
  (deps: Deps) =>
  (id: string, active: boolean, token: string): Promise<Result<UserDetail, UsersError>> =>
    deps.client.setActive(id, active, token)

export const createGetMe =
  (deps: Deps) =>
  (token: string): Promise<Result<UserDetail, UsersError>> =>
    deps.client.getMe(token)

export const createUpdateMe =
  (deps: Deps) =>
  (input: UpdateMeInput, token: string): Promise<Result<UserDetail, UsersError>> =>
    deps.client.updateMe(input, token)

export const createChangePassword =
  (deps: Deps) =>
  (input: ChangePasswordInput, token: string): Promise<Result<void, UsersError>> =>
    deps.client.changePassword(input, token)
