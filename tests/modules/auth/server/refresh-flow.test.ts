/**
 * US3 — fluxo de renovação silenciosa (integração): session.guard + refresh-session + store REAIS.
 * Access expirado → resolve dispara refresh single-flight → devolve novo token; reuse → sessão morre.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createMemorySessionStore } from '#external/session/session-store.memory.ts'
import { createRefreshSession } from '#modules/auth/server/application/commands/refresh-session.use-case.ts'
import { createResolveSession } from '#modules/auth/server/adapters/session.guard.ts'
import { ok, err, isOk, isErr, type Result } from '#shared/primitives/result.ts'
import type { Session, SessionId, AuthTokens } from '#modules/auth/server/domain/session/session.types.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'

const SID = 's1' as SessionId
const NOW = 100_000
const expiredSession: Session = {
  sessionId: SID,
  userId: 'u',
  accessToken: 'a1',
  refreshToken: 'r1',
  accessExpiresAt: 10_000, // já expirado p/ NOW
  refreshExpiresAt: 9_999_999_999,
  persistent: false,
}

const wire = (refresh: () => Promise<Result<AuthTokens, AuthError>>) => {
  const store = createMemorySessionStore<Session>({ now: () => NOW })
  const refreshSession = createRefreshSession({
    client: { refresh },
    store,
    now: () => NOW,
    decodeExp: () => NOW + 900_000, // novo access válido
  })
  const resolve = createResolveSession({ store, refreshSession, now: () => NOW })
  return { store, resolve }
}

describe('US3 — refresh-flow (integração)', () => {
  it('access expirado + refresh ok → resolve devolve token novo e o store é atualizado', async () => {
    const { store, resolve } = wire(() => Promise.resolve(ok({ accessToken: 'a2', refreshToken: 'r2', userId: 'u' })))
    await store.set(SID, expiredSession, 9_000_000)

    const r = await resolve(SID)

    assert.equal(isOk(r) && r.value.accessToken === 'a2', true)
    const stored = await store.get(SID)
    assert.equal(isOk(stored) && stored.value.refreshToken === 'r2', true)
  })

  it('refresh-rotated (reuse) → resolve falha e a sessão é apagada (signOut)', async () => {
    const { store, resolve } = wire(() => Promise.resolve(err('refresh-rotated')))
    await store.set(SID, expiredSession, 9_000_000)

    const r = await resolve(SID)

    assert.equal(isErr(r), true)
    assert.equal(isErr(await store.get(SID)), true)
  })
})
