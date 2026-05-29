/**
 * Testes de `createAppQueryClient` — política de erro do QueryClient (composition root).
 * queryCache.onError: QueryError(auth:expired) → onAuthExpired (signOut). Outros erros: ignora.
 * Lógica testada em node:test (QueryClient roda sem DOM). TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createAppQueryClient } from '../../src/query-client.ts'
import { QueryError } from '../../src/shared/http/query-error.ts'

describe('createAppQueryClient — política de auth:expired', () => {
  it('chama onAuthExpired quando QueryError(auth:expired)', () => {
    let called = 0
    const client = createAppQueryClient(() => {
      called += 1
    })

    client.getQueryCache().config.onError?.(new QueryError({ kind: 'auth:expired' }), {} as never)

    assert.equal(called, 1)
  })

  it('NÃO chama onAuthExpired para QueryError de outro kind', () => {
    let called = 0
    const client = createAppQueryClient(() => {
      called += 1
    })

    client.getQueryCache().config.onError?.(new QueryError({ kind: 'server' }), {} as never)

    assert.equal(called, 0)
  })

  it('NÃO chama onAuthExpired para Error comum', () => {
    let called = 0
    const client = createAppQueryClient(() => {
      called += 1
    })

    client.getQueryCache().config.onError?.(new Error('boom'), {} as never)

    assert.equal(called, 0)
  })

  it('tem mutationCache.onSuccess configurado (invalidação)', () => {
    const client = createAppQueryClient(() => undefined)

    assert.equal(typeof client.getMutationCache().config.onSuccess, 'function')
  })
})
