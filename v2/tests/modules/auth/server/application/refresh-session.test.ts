/**
 * refresh-session use-case — SINGLE-FLIGHT (uma renovação por sessão) + reuse-detection.
 * CRÍTICO: o backend rotaciona o refresh e revoga a cadeia em reuse → refresh concorrente NÃO pode
 * disparar 2 chamadas. TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createRefreshSession } from '#modules/auth/server/application/commands/refresh-session.use-case.ts'
import { createMemorySessionStore } from '#external/session/session-store.memory.ts'
import { ok, err, isOk, isErr, type Result } from '#shared/primitives/result.ts'
import type { Session, SessionId, AuthTokens } from '#modules/auth/server/domain/session/session.types.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'

const SID = 's1' as SessionId
const baseSession: Session = {
  sessionId: SID,
  userId: 'u',
  accessToken: 'a1',
  refreshToken: 'r1',
  accessExpiresAt: 0,
  refreshExpiresAt: 9_999_999_999,
  persistent: false,
}

describe('refresh-session — single-flight', () => {
  it('2 chamadas concorrentes → 1 refresh no backend', async () => {
    let calls = 0
    const client = {
      refresh: (): Promise<Result<AuthTokens, AuthError>> => {
        calls += 1
        return new Promise((res) => {
          setTimeout(() => {
            res(ok({ accessToken: 'a2', refreshToken: 'r2', userId: 'u' }))
          }, 5)
        })
      },
    }
    const store = createMemorySessionStore<Session>({ now: () => 1_000 })
    const refresh = createRefreshSession({ client, store, now: () => 1_000, decodeExp: () => 9_000_000 })

    const [a, b] = await Promise.all([refresh(SID, baseSession), refresh(SID, baseSession)])

    assert.equal(calls, 1)
    assert.equal(isOk(a) && isOk(b), true)
    if (isOk(a)) assert.equal(a.value.refreshToken, 'r2')
  })
})

describe('refresh-session — reuse-detection', () => {
  it('refresh-rotated → mata a sessão (delete no store) e devolve o erro', async () => {
    const client = { refresh: (): Promise<Result<AuthTokens, AuthError>> => Promise.resolve(err('refresh-rotated')) }
    const store = createMemorySessionStore<Session>({ now: () => 1_000 })
    await store.set(SID, baseSession, 10_000)
    const refresh = createRefreshSession({ client, store, now: () => 1_000, decodeExp: () => 9_000_000 })

    const r = await refresh(SID, baseSession)

    assert.equal(isErr(r) && r.error === 'refresh-rotated', true)
    const got = await store.get(SID)
    assert.equal(isErr(got) && got.error === 'not-found', true)
  })
})
