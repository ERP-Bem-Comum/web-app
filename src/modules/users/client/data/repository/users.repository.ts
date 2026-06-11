/**
 * UsersRepository — porta do client para o BFF. Converte `{ ok, data|error }` → `Result` (§II). Tipos do
 * próprio `data/model`; `UsersError`/`FnResult` do `users-error.ts` neutro (boundary §I). Fns injetadas
 * (testável). Espelha o `ActRepository` (por ora só `list`).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  UserListInput,
  UserListResponse,
  CreateUserInput,
  CreatedUser,
  UserDetail,
  UpdateUserInput,
  UpdateMeInput,
  ChangePasswordInput,
} from '#modules/users/client/data/model/user.model.ts'
import type { UsersError, FnResult } from '#modules/users/client/data/repository/users-error.ts'

type ListFn = (opts: { data: UserListInput }) => Promise<FnResult<UserListResponse>>
type CreateFn = (opts: { data: CreateUserInput }) => Promise<FnResult<CreatedUser>>
type GetFn = (opts: { data: { id: string } }) => Promise<FnResult<UserDetail>>
type UpdateFn = (opts: { data: UpdateUserInput & { id: string } }) => Promise<FnResult<UserDetail>>
type SetStatusFn = (opts: { data: { id: string; active: boolean } }) => Promise<FnResult<UserDetail>>
type GetMeFn = () => Promise<FnResult<UserDetail>>
type UpdateMeFn = (opts: { data: UpdateMeInput }) => Promise<FnResult<UserDetail>>
type ChangePasswordFn = (opts: { data: ChangePasswordInput }) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; error: UsersError }>>

export type UsersRepository = Readonly<{
  list: (input: UserListInput) => Promise<Result<UserListResponse, UsersError>>
  create: (input: CreateUserInput) => Promise<Result<CreatedUser, UsersError>>
  getById: (id: string) => Promise<Result<UserDetail, UsersError>>
  update: (input: UpdateUserInput & { id: string }) => Promise<Result<UserDetail, UsersError>>
  setActive: (id: string, active: boolean) => Promise<Result<UserDetail, UsersError>>
  getMe: () => Promise<Result<UserDetail, UsersError>>
  updateMe: (input: UpdateMeInput) => Promise<Result<UserDetail, UsersError>>
  changePassword: (input: ChangePasswordInput) => Promise<Result<void, UsersError>>
}>

export const createUsersRepository = (
  deps: Readonly<{
    listUsersFn: ListFn
    createUserFn: CreateFn
    getUserFn: GetFn
    updateUserFn: UpdateFn
    setUserStatusFn: SetStatusFn
    getMeFn: GetMeFn
    updateMeFn: UpdateMeFn
    changePasswordFn: ChangePasswordFn
  }>,
): UsersRepository => ({
  list: async (input) => {
    const res = await deps.listUsersFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  create: async (input) => {
    const res = await deps.createUserFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getById: async (id) => {
    const res = await deps.getUserFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  update: async (input) => {
    const res = await deps.updateUserFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  setActive: async (id, active) => {
    const res = await deps.setUserStatusFn({ data: { id, active } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getMe: async () => {
    const res = await deps.getMeFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
  updateMe: async (input) => {
    const res = await deps.updateMeFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  changePassword: async (input) => {
    const res = await deps.changePasswordFn({ data: input })
    return res.ok ? ok(undefined) : err(res.error)
  },
})
