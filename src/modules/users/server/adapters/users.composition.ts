/**
 * Composition root do server/users. Monta os use-cases com o client real. Env lido DENTRO da função
 * (nunca em escopo de módulo). Users/me vivem em `/api/v1` (legado espelhado — ADR-0033); `/auth/*` é
 * `/api/v2` (modelo novo). Ambas as bases vêm do helper único `coreApiBase`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
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

const build = () => {
  const env = loadEnvOrThrow()
  // baseUrl = /api/v1 (usuários + /me); authBaseUrl = /api/v2 (p/ /auth/change-password).
  const client = createCoreApiUsersClient(
    coreApiBase(env.CORE_API_URL, 'v1'),
    coreApiBase(env.CORE_API_URL, 'v2'),
  )
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
