/**
 * Composition root do server/auth (server-side). Monta os use-cases com suas deps reais.
 * - `store` é singleton de MÓDULO (persiste entre requests; in-memory dev → trocar por Redis-like em prod).
 * - env é lido DENTRO de uma função (memoizado), NUNCA em escopo de módulo (pegadinha v1.168: vaza no
 *   bundle / edge avalia antes do request).
 * - `refreshSession` é singleton (o single-flight precisa do MESMO closure entre requests).
 */
import { createMemorySessionStore } from '#external/session/session-store.memory.ts'
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import type { Session, SessionId } from '#modules/auth/server/domain/session/session.types.ts'
import { createLogin } from '#modules/auth/server/application/commands/login.use-case.ts'
import { createGetMe } from '#modules/auth/server/application/queries/get-me.use-case.ts'
import { createLogout } from '#modules/auth/server/application/commands/logout.use-case.ts'
import { createRefreshSession } from '#modules/auth/server/application/commands/refresh-session.use-case.ts'
import { createCoreApiAuthClient } from '#modules/auth/server/adapters/core-api/core-api-auth.ts'
import { createResolveSession } from './session.guard.ts'
import { decodeAccessExp } from '#modules/auth/server/adapters/core-api/decode-access-exp.ts'

const store = createMemorySessionStore<Session>({ now: () => Date.now() })
const now = (): number => Date.now()
const genId = (): SessionId => globalThis.crypto.randomUUID() as SessionId

type AuthServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow() // lê process.env aqui (não no módulo)
  const client = createCoreApiAuthClient(
    coreApiBase(env.CORE_API_URL, 'v2'),
    coreApiBase(env.CORE_API_URL, 'v1'), // aprovadores (#148) vivem em /api/v1
  )
  const refreshSession = createRefreshSession({ client, store, now, decodeExp: decodeAccessExp })
  return {
    store,
    login: createLogin({ client, store, now, decodeExp: decodeAccessExp, genId }),
    getMe: createGetMe({ client }),
    logout: createLogout({ client, store }),
    resolveSession: createResolveSession({ store, refreshSession, now }),
    // Leitura pública da política de senha (#32) — passthrough do client (sem use-case próprio).
    getPasswordPolicy: () => client.getPasswordPolicy(),
    // Aprovadores elegíveis (#148) — passthrough do client (RBAC user:list no core-api).
    listApprovers: (accessToken: string) => client.listApprovers(accessToken),
    // Recuperação de senha (#037) — passthrough público (sem sessão). Anti-enumeração: sempre 202.
    forgotPassword: (input: Readonly<{ email: string }>) => client.forgotPassword(input),
  }
}

let cached: AuthServer | undefined
export const authServer = (): AuthServer => (cached ??= build())
