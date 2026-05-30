/**
 * Composition root do server/auth (server-side). Monta os use-cases com suas deps reais.
 * - `store` é singleton de MÓDULO (persiste entre requests; in-memory dev → trocar por Redis-like em prod).
 * - env é lido DENTRO de uma função (memoizado), NUNCA em escopo de módulo (pegadinha v1.168: vaza no
 *   bundle / edge avalia antes do request).
 * - `refreshSession` é singleton (o single-flight precisa do MESMO closure entre requests).
 */
import { createMemorySessionStore } from '../../../../external/session/session-store.memory.ts'
import { loadEnvOrThrow } from '../../../../external/config/env.config.ts'
import type { Session, SessionId } from '../domain/session.types.ts'
import { createLogin } from '../application/login.use-case.ts'
import { createGetMe } from '../application/get-me.use-case.ts'
import { createRefreshSession } from '../application/refresh-session.use-case.ts'
import { createCoreApiAuthClient } from './core-api-auth.ts'
import { createResolveSession } from './session.guard.ts'
import { decodeAccessExp } from './decode-access-exp.ts'

const store = createMemorySessionStore<Session>({ now: () => Date.now() })
const now = (): number => Date.now()
const genId = (): SessionId => globalThis.crypto.randomUUID() as SessionId

type AuthServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow() // lê process.env aqui (não no módulo)
  const client = createCoreApiAuthClient(env.CORE_API_URL)
  const refreshSession = createRefreshSession({ client, store, now, decodeExp: decodeAccessExp })
  return {
    store,
    login: createLogin({ client, store, now, decodeExp: decodeAccessExp, genId }),
    getMe: createGetMe({ client }),
    resolveSession: createResolveSession({ store, refreshSession, now }),
  }
}

let cached: AuthServer | undefined
export const authServer = (): AuthServer => (cached ??= build())
