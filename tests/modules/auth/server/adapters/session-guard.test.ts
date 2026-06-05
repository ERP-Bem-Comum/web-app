/**
 * resolveSession (session.guard) — cookie→sessão→access token, com refresh silencioso.
 * O guard recebe o `sessionId` (lido do cookie pela server fn). TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createResolveSession } from '#modules/auth/server/adapters/session.guard.ts'
import { createMemorySessionStore } from '#external/session/session-store.memory.ts'
import { ok, err, isOk, isErr, type Result } from '#shared/primitives/result.ts'
import type { Session, SessionId } from '#modules/auth/server/domain/session/session.types.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'

const SID = 's1' as SessionId
const session = (over: Partial<Session>): Session => ({
  sessionId: SID,
  userId: 'u',
  accessToken: 'a1',
  refreshToken: 'r1',
  accessExpiresAt: 10_000,
  refreshExpiresAt: 9_999_999_999,
  persistent: false,
  ...over,
})

const noRefresh = (): Promise<Result<Session, AuthError>> => Promise.resolve(err('session-not-found'))

describe('resolveSession', () => {
  it('sem sessão no store → err(session-not-found)', async () => {
    const store = createMemorySessionStore<Session>({ now: () => 1_000 })
    const resolve = createResolveSession({ store, refreshSession: noRefresh, now: () => 1_000 })
    const r = await resolve(SID)
    assert.equal(isErr(r) && r.error === 'session-not-found', true)
  })

  it('access válido → ok(accessToken sem refresh)', async () => {
    const store = createMemorySessionStore<Session>({ now: () => 1_000 })
    await store.set(SID, session({ accessExpiresAt: 10_000 }), 1_000_000)
    let refreshed = 0
    const resolve = createResolveSession({
      store,
      refreshSession: () => {
        refreshed += 1
        return noRefresh()
      },
      now: () => 1_000,
    })
    const r = await resolve(SID)
    assert.equal(isOk(r) && r.value.accessToken === 'a1', true)
    assert.equal(refreshed, 0)
  })

  it('access expirado + refresh ok → ok(novo token)', async () => {
    const store = createMemorySessionStore<Session>({ now: () => 50_000 })
    await store.set(SID, session({ accessExpiresAt: 10_000 }), 1_000_000)
    const resolve = createResolveSession({
      store,
      refreshSession: () => Promise.resolve(ok(session({ accessToken: 'a2', accessExpiresAt: 99_000 }))),
      now: () => 50_000,
    })
    const r = await resolve(SID)
    assert.equal(isOk(r) && r.value.accessToken === 'a2', true)
  })

  it('access expirado + refresh falha → err(auth)', async () => {
    const store = createMemorySessionStore<Session>({ now: () => 50_000 })
    await store.set(SID, session({ accessExpiresAt: 10_000 }), 1_000_000)
    const resolve = createResolveSession({
      store,
      refreshSession: () => Promise.resolve(err('refresh-expired')),
      now: () => 50_000,
    })
    const r = await resolve(SID)
    assert.equal(isErr(r) && r.error === 'refresh-expired', true)
  })
})
