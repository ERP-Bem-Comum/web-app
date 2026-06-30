/**
 * UsersError — erro do módulo users propagado pelo BFF (string union; espelha o `UsersError` do server).
 * Arquivo NEUTRO da camada `client/data`. A UI nunca olha status HTTP — trata só a tag i18n via
 * `usersErrorTag` (§V).
 */
export type UsersError =
  | 'not-found'
  | 'validation'
  | 'email-taken'
  | 'invalid-current-password'
  | 'password-weak'
  | 'password-too-short'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'connectivity'
  | 'server'

/** Forma do retorno RPC das server fns do módulo (`{ ok, data } | { ok, error }`). */
export type FnResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: UsersError }>
