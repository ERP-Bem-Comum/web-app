/**
 * SessionStore in-memory (dev) — impl GENÉRICA do port `shared/ports/session-store`. `now` injetável
 * (testabilidade). Para prod/escala horizontal, trocar por uma impl compartilhada (Redis-like) com a
 * MESMA interface — o módulo auth não muda (ADR-0004 / Clarifications: sessão stateful, store compartilhável).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { SessionStore } from '#shared/ports/session-store.port.ts'

type Entry<T> = Readonly<{ value: T; expiresAt: number }>

export const createMemorySessionStore = <T>(deps: Readonly<{ now: () => number }>): SessionStore<T> => {
  const map = new Map<string, Entry<T>>()
  return {
    set: (id, value, ttlMs) => {
      map.set(id, { value, expiresAt: deps.now() + ttlMs })
      return Promise.resolve()
    },
    get: (id): Promise<Result<T, 'not-found' | 'expired'>> => {
      const entry = map.get(id)
      if (entry === undefined) return Promise.resolve(err('not-found'))
      if (deps.now() >= entry.expiresAt) {
        map.delete(id)
        return Promise.resolve(err('expired'))
      }
      return Promise.resolve(ok(entry.value))
    },
    delete: (id) => {
      map.delete(id)
      return Promise.resolve()
    },
  }
}
