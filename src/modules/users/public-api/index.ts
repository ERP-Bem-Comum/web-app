/**
 * Public API do módulo Gestão de Usuários — ÚNICO ponto de import por fora do módulo (boundary §I).
 * Hoje: slice de listagem (grid) ligado ao core-api `/api/v1/users`.
 */
export { listUsersFn } from '#modules/users/server/adapters/server-fns/list-users.query.fn.ts'
export type { ListUsersFnResult } from '#modules/users/server/adapters/server-fns/list-users.query.fn.ts'
export { createUserFn } from '#modules/users/server/adapters/server-fns/create-user.service.fn.ts'
export type { CreateUserFnResult } from '#modules/users/server/adapters/server-fns/create-user.service.fn.ts'
export { getUserFn } from '#modules/users/server/adapters/server-fns/get-user.query.fn.ts'
export type { GetUserFnResult } from '#modules/users/server/adapters/server-fns/get-user.query.fn.ts'
export { updateUserFn } from '#modules/users/server/adapters/server-fns/update-user.service.fn.ts'
export type { UpdateUserFnResult } from '#modules/users/server/adapters/server-fns/update-user.service.fn.ts'
export { setUserStatusFn } from '#modules/users/server/adapters/server-fns/set-user-status.service.fn.ts'
export type { SetUserStatusFnResult } from '#modules/users/server/adapters/server-fns/set-user-status.service.fn.ts'
export { getMeFn } from '#modules/users/server/adapters/server-fns/get-me.query.fn.ts'
export type { GetMeFnResult } from '#modules/users/server/adapters/server-fns/get-me.query.fn.ts'
export { updateMeFn } from '#modules/users/server/adapters/server-fns/update-me.service.fn.ts'
export type { UpdateMeFnResult } from '#modules/users/server/adapters/server-fns/update-me.service.fn.ts'
export { changePasswordFn } from '#modules/users/server/adapters/server-fns/change-password.service.fn.ts'
export type { ChangePasswordFnResult } from '#modules/users/server/adapters/server-fns/change-password.service.fn.ts'

// Perfil do usuário logado (autosserviço GET /api/v1/me) — query CLIENT compartilhada (queryKey
// ['users','me']). Consumida pelo slice "Minha Conta" e também pelo shell (o topbar exibe o nome).
// Como a mutation de Minha Conta invalida ['users'], o topbar reflete a alteração automaticamente.
export { myAccountQueryOptions } from '#modules/users/client/my-account/my-account.query.ts'
