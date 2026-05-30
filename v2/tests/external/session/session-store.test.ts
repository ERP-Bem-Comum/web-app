/**
 * SessionStore in-memory (impl genérica do port). TTL via `now` injetável.
 * TDD: escrito ANTES da impl.
 */
import { describe, it, beforeEach } from 'node:test'
import { strict as assert } from 'node:assert'

import { createMemorySessionStore } from '../../../src/external/session/session-store.memory.ts'
import { isOk, isErr } from '../../../src/shared/primitives/result.ts'

let nowMs = 1_000
const advance = (ms: number): void => {
  nowMs += ms
}

beforeEach(() => {
  nowMs = 1_000
})

const makeStore = () => createMemorySessionStore<{ userId: string }>({ now: () => nowMs })

describe('SessionStore in-memory', () => {
  it('set + get → ok(value)', async () => {
    const store = makeStore()
    await store.set('s1', { userId: 'u1' }, 5_000)

    const r = await store.get('s1')

    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(r.value.userId, 'u1')
  })

  it('get de id inexistente → err(not-found)', async () => {
    const store = makeStore()
    const r = await store.get('nope')
    assert.equal(isErr(r) && r.error === 'not-found', true)
  })

  it('get após TTL → err(expired)', async () => {
    const store = makeStore()
    await store.set('s1', { userId: 'u1' }, 5_000)
    advance(5_001)

    const r = await store.get('s1')
    assert.equal(isErr(r) && r.error === 'expired', true)
  })

  it('delete remove a sessão', async () => {
    const store = makeStore()
    await store.set('s1', { userId: 'u1' }, 5_000)
    await store.delete('s1')

    const r = await store.get('s1')
    assert.equal(isErr(r) && r.error === 'not-found', true)
  })
})
