/**
 * Composition root do server/users. Monta os use-cases com o client real. Env lido DENTRO da função
 * (nunca em escopo de módulo). Users vive em `/api/v1` (como Parceiros — ADR-0033) — derivamos a base do
 * `CORE_API_URL` (que inclui o prefixo `/api/v2` usado por auth/contracts).
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { createCoreApiUsersClient } from './core-api/core-api-users.ts'
import {
  createListUsers,
  createCreateUser,
  createGetUser,
  createUpdateUser,
  createSetUserActive,
  createGetMe,
  createUpdateMe,
  createChangePassword,
} from '#modules/users/server/application/users.use-cases.ts'

type UsersServer = ReturnType<typeof build>

const deriveUsersBase = (coreApiUrl: string): string =>
  coreApiUrl.includes('/api/v2')
    ? coreApiUrl.replace('/api/v2', '/api/v1')
    : `${coreApiUrl.replace(/\/+$/, '')}/api/v1`

const build = () => {
  const env = loadEnvOrThrow()
  // baseUrl = /api/v1 (usuários + /me); authBaseUrl = CORE_API_URL (/api/v2, p/ /auth/change-password).
  const client = createCoreApiUsersClient(deriveUsersBase(env.CORE_API_URL), env.CORE_API_URL)
  return {
    listUsers: createListUsers({ client }),
    createUser: createCreateUser({ client }),
    getUser: createGetUser({ client }),
    updateUser: createUpdateUser({ client }),
    setUserActive: createSetUserActive({ client }),
    getMe: createGetMe({ client }),
    updateMe: createUpdateMe({ client }),
    changePassword: createChangePassword({ client }),
  }
}

let cached: UsersServer | undefined
export const usersServer = (): UsersServer => (cached ??= build())
