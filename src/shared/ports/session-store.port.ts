/**
 * SessionStore — port GENÉRICO (cross-cutting, `shared/ports`). Guarda um valor opaco por id, com TTL.
 * Genérico de propósito: o módulo auth usa `SessionStore<Session>`, mas `external/` (a impl) não conhece
 * o domínio de nenhum módulo (boundary). Impl real em `external/session` (in-memory dev; Redis-like prod).
 */
import type { Result } from '../primitives/result.ts'

export type SessionStore<T> = Readonly<{
  /** Grava/atualiza o valor sob `id`, expirando em `ttlMs` a partir de agora. */
  set: (id: string, value: T, ttlMs: number) => Promise<void>
  /** Recupera; `expired` se o TTL passou; `not-found` se não existe. */
  get: (id: string) => Promise<Result<T, 'not-found' | 'expired'>>
  delete: (id: string) => Promise<void>
}>
